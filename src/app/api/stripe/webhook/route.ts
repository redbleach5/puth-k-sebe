import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import Stripe from "stripe"

export async function POST(req: NextRequest) {
  try {
    const body = await req.text()
    const signature = req.headers.get("stripe-signature")

    if (!signature) {
      return NextResponse.json(
        { error: "Отсутствует подпись Stripe" },
        { status: 400 }
      )
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? "", {
      apiVersion: "2025-04-30.basil",
    })

    let event: Stripe.Event

    try {
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET ?? ""
      )
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error"
      console.error("Webhook signature verification failed:", errorMessage)
      return NextResponse.json(
        { error: "Ошибка проверки подписи webhook" },
        { status: 400 }
      )
    }

    // Handle events
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session
        const userId = session.metadata?.userId
        const plan = session.metadata?.plan ?? "monthly"

        if (!userId) break

        // Get the subscription from Stripe
        if (session.subscription) {
          const stripeSubscription = await stripe.subscriptions.retrieve(
            session.subscription as string
          )

          await db.subscription.upsert({
            where: { userId },
            update: {
              stripeSubscriptionId: stripeSubscription.id,
              stripePriceId: stripeSubscription.items.data[0]?.price.id,
              status: "active",
              plan: plan,
              currentPeriodStart: new Date(stripeSubscription.current_period_start * 1000),
              currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
              cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end,
            },
            create: {
              userId,
              stripeCustomerId: stripeSubscription.customer as string,
              stripeSubscriptionId: stripeSubscription.id,
              stripePriceId: stripeSubscription.items.data[0]?.price.id,
              status: "active",
              plan: plan,
              currentPeriodStart: new Date(stripeSubscription.current_period_start * 1000),
              currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
              cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end,
            },
          })
        }
        break
      }

      case "customer.subscription.updated": {
        const stripeSubscription = event.data.object as Stripe.Subscription
        const customerId = stripeSubscription.customer as string

        // Find subscription by Stripe customer ID
        const existingSub = await db.subscription.findUnique({
          where: { stripeCustomerId: customerId },
        })

        if (!existingSub) break

        const newPlan =
          stripeSubscription.items.data[0]?.price.id ===
          process.env.STRIPE_YEARLY_PRICE_ID
            ? "yearly"
            : "monthly"

        await db.subscription.update({
          where: { userId: existingSub.userId },
          data: {
            stripeSubscriptionId: stripeSubscription.id,
            stripePriceId: stripeSubscription.items.data[0]?.price.id,
            status: stripeSubscription.status === "active" ? "active" : stripeSubscription.status,
            plan: newPlan,
            currentPeriodStart: new Date(stripeSubscription.current_period_start * 1000),
            currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
            cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end,
          },
        })
        break
      }

      case "customer.subscription.deleted": {
        const stripeSubscription = event.data.object as Stripe.Subscription
        const customerId = stripeSubscription.customer as string

        const existingSub = await db.subscription.findUnique({
          where: { stripeCustomerId: customerId },
        })

        if (!existingSub) break

        await db.subscription.update({
          where: { userId: existingSub.userId },
          data: {
            status: "free",
            plan: "free",
            stripeSubscriptionId: null,
            stripePriceId: null,
            cancelAtPeriodEnd: false,
          },
        })
        break
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice
        const customerId = invoice.customer as string

        const existingSub = await db.subscription.findUnique({
          where: { stripeCustomerId: customerId },
        })

        if (!existingSub) break

        // Update subscription status to active
        await db.subscription.update({
          where: { userId: existingSub.userId },
          data: {
            status: "active",
          },
        })

        // Create payment record
        await db.payment.create({
          data: {
            userId: existingSub.userId,
            stripePaymentIntentId: invoice.payment_intent as string ?? undefined,
            amount: invoice.amount_paid,
            currency: invoice.currency,
            status: "succeeded",
            description: `Оплата подписки — ${existingSub.plan === "yearly" ? "Годовая" : "Месячная"}`,
          },
        })
        break
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice
        const customerId = invoice.customer as string

        const existingSub = await db.subscription.findUnique({
          where: { stripeCustomerId: customerId },
        })

        if (!existingSub) break

        // Update subscription status to past_due
        await db.subscription.update({
          where: { userId: existingSub.userId },
          data: {
            status: "past_due",
          },
        })

        // Create failed payment record
        await db.payment.create({
          data: {
            userId: existingSub.userId,
            stripePaymentIntentId: invoice.payment_intent as string ?? undefined,
            amount: invoice.amount_due,
            currency: invoice.currency,
            status: "failed",
            description: `Неудачная попытка оплаты — ${existingSub.plan === "yearly" ? "Годовая" : "Месячная"}`,
          },
        })
        break
      }

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error("Webhook handler error:", error)
    return NextResponse.json(
      { error: "Внутренняя ошибка сервера" },
      { status: 500 }
    )
  }
}
