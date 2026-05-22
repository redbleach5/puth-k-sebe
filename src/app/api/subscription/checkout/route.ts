import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { z } from "zod"
import { getStripe } from "@/lib/stripe"

const checkoutSchema = z.object({
  priceId: z.string().min(1, "Укажите тарифный план"),
  plan: z.enum(["monthly", "yearly"], {
    message: "Выберите тип подписки: monthly или yearly",
  }),
})

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Необходима авторизация" },
        { status: 401 }
      )
    }

    const body = await req.json()
    const validatedData = checkoutSchema.parse(body)
    const stripe = getStripe();

    // Get or create Stripe customer
    let subscription = await db.subscription.findUnique({
      where: { userId: session.user.id },
    })

    let customerId = subscription?.stripeCustomerId ?? undefined

    if (!customerId) {
      const user = await db.user.findUnique({
        where: { id: session.user.id },
      })

      const customer = await stripe.customers.create({
        email: user?.email ?? session.user.email,
        name: user?.name ?? session.user.name ?? undefined,
        metadata: {
          userId: session.user.id,
        },
      })

      customerId = customer.id

      // Update subscription with Stripe customer ID
      if (subscription) {
        await db.subscription.update({
          where: { userId: session.user.id },
          data: { stripeCustomerId: customerId },
        })
      } else {
        await db.subscription.create({
          data: {
            userId: session.user.id,
            stripeCustomerId: customerId,
            plan: "free",
            status: "free",
          },
        })
      }
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"

    // Create Checkout Session
    const checkoutSession = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [
        {
          price: validatedData.priceId,
          quantity: 1,
        },
      ],
      success_url: `${appUrl}/?subscription=success`,
      cancel_url: `${appUrl}/?subscription=canceled`,
      metadata: {
        userId: session.user.id,
        plan: validatedData.plan,
      },
    })

    return NextResponse.json({
      sessionUrl: checkoutSession.url,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstError = error.issues[0]
      return NextResponse.json(
        { error: firstError.message },
        { status: 400 }
      )
    }

    console.error("Checkout session error:", error)
    return NextResponse.json(
      { error: "Произошла ошибка при создании сессии оплаты. Попробуйте позже." },
      { status: 500 }
    )
  }
}
