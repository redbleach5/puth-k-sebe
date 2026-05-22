import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import Stripe from "stripe"

// Stripe v22 changed the Subscription type structure
// Use a mapped type to access snake_case properties
type StripeSubscriptionData = {
  id: string
  customer: string | { id: string }
  current_period_start: number
  current_period_end: number
  cancel_at_period_end: boolean
  items: { data: Array<{ price: { id: string } }> }
  status: string
}

function getCustomerId(customer: string | { id: string }): string {
  return typeof customer === "string" ? customer : customer.id
}

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

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? "")

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
          ) as unknown as StripeSubscriptionData

          // Use upsert with userId as the unique key.
          // The Subscription record should already exist (created at registration or checkout init),
          // but we handle the create case as well for robustness.
          const customerId = getCustomerId(stripeSubscription.customer);
          
          // First try to update existing subscription
          const existingSub = await db.subscription.findUnique({
            where: { userId },
          });

          if (existingSub) {
            await db.subscription.update({
              where: { userId },
              data: {
                stripeCustomerId: customerId,
                stripeSubscriptionId: stripeSubscription.id,
                stripePriceId: stripeSubscription.items.data[0]?.price.id,
                status: "active",
                plan: plan,
                currentPeriodStart: new Date(stripeSubscription.current_period_start * 1000),
                currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
                cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end,
              },
            });
          } else {
            // Create subscription if it doesn't exist (shouldn't happen normally)
            await db.subscription.create({
              data: {
                userId,
                stripeCustomerId: customerId,
                stripeSubscriptionId: stripeSubscription.id,
                stripePriceId: stripeSubscription.items.data[0]?.price.id,
                status: "active",
                plan: plan,
                currentPeriodStart: new Date(stripeSubscription.current_period_start * 1000),
                currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
                cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end,
              },
            });
          }
        }
        break
      }

      case "customer.subscription.updated": {
        const stripeSubscription = event.data.object as unknown as StripeSubscriptionData
        const customerId = getCustomerId(stripeSubscription.customer)

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
        const stripeSubscription = event.data.object as unknown as StripeSubscriptionData
        const customerId = getCustomerId(stripeSubscription.customer)

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
        const invoice = event.data.object as unknown as Record<string, unknown>
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
            stripePaymentIntentId: (invoice.payment_intent as string) ?? undefined,
            amount: invoice.amount_paid as number,
            currency: invoice.currency as string,
            status: "succeeded",
            description: `Оплата подписки — ${existingSub.plan === "yearly" ? "Годовая" : "Месячная"}`,
          },
        })
        break
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as unknown as Record<string, unknown>
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
            stripePaymentIntentId: (invoice.payment_intent as string) ?? undefined,
            amount: invoice.amount_due as number,
            currency: invoice.currency as string,
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
