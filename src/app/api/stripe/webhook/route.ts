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

function getPaymentIntentId(paymentIntent: unknown): string | undefined {
  if (typeof paymentIntent === "string") return paymentIntent
  if (paymentIntent && typeof paymentIntent === "object" && "id" in paymentIntent) {
    return (paymentIntent as { id: string }).id
  }
  return undefined
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
            status: "canceled",
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
        const customerId = typeof invoice.customer === "string" ? invoice.customer : (invoice.customer as { id: string })?.id

        if (!customerId) break

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

        // Create payment record with idempotency check
        const paymentIntentId = getPaymentIntentId(invoice.payment_intent)
        if (paymentIntentId) {
          // Check if payment already exists (idempotency)
          const existingPayment = await db.payment.findUnique({
            where: { stripePaymentIntentId: paymentIntentId },
          })
          if (!existingPayment) {
            await db.payment.create({
              data: {
                userId: existingSub.userId,
                stripePaymentIntentId: paymentIntentId,
                amount: invoice.amount_paid as number,
                currency: invoice.currency as string,
                status: "succeeded",
                description: `Оплата подписки — ${existingSub.plan === "yearly" ? "Годовая" : "Месячная"}`,
              },
            })
          }
        }
        break
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as unknown as Record<string, unknown>
        const customerId = typeof invoice.customer === "string" ? invoice.customer : (invoice.customer as { id: string })?.id

        if (!customerId) break

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

        // Create failed payment record with idempotency check
        const paymentIntentId = getPaymentIntentId(invoice.payment_intent)
        if (paymentIntentId) {
          // Check if payment already exists (idempotency)
          const existingPayment = await db.payment.findUnique({
            where: { stripePaymentIntentId: paymentIntentId },
          })
          if (!existingPayment) {
            await db.payment.create({
              data: {
                userId: existingSub.userId,
                stripePaymentIntentId: paymentIntentId,
                amount: invoice.amount_due as number,
                currency: invoice.currency as string,
                status: "failed",
                description: `Неудачная попытка оплаты — ${existingSub.plan === "yearly" ? "Годовая" : "Месячная"}`,
              },
            })
          }
        }
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
