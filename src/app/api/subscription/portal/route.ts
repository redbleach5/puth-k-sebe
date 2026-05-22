import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { getStripe } from "@/lib/stripe"

export async function POST() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Необходима авторизация" },
        { status: 401 }
      )
    }

    const subscription = await db.subscription.findUnique({
      where: { userId: session.user.id },
    })

    if (!subscription?.stripeCustomerId) {
      return NextResponse.json(
        { error: "У вас нет активной подписки для управления" },
        { status: 400 }
      )
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"
    const stripe = getStripe();

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: subscription.stripeCustomerId,
      return_url: `${appUrl}/`,
    })

    return NextResponse.json({
      portalUrl: portalSession.url,
    })
  } catch (error) {
    console.error("Portal session error:", error)
    return NextResponse.json(
      { error: "Произошла ошибка при открытии управления подпиской. Попробуйте позже." },
      { status: 500 }
    )
  }
}
