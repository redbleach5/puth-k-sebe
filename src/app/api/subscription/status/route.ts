import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

export async function GET() {
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

    if (!subscription) {
      return NextResponse.json({
        plan: "free",
        status: "free",
        currentPeriodStart: null,
        currentPeriodEnd: null,
        cancelAtPeriodEnd: false,
        stripeCustomerId: null,
      })
    }

    // Check if subscription has expired (currentPeriodEnd in the past)
    let effectiveStatus = subscription.status
    let effectivePlan = subscription.plan

    if (subscription.plan !== "free" && subscription.currentPeriodEnd) {
      const now = new Date()
      const periodEnd = new Date(subscription.currentPeriodEnd)

      if (periodEnd < now && subscription.status === "active") {
        // Subscription period has ended but no webhook received yet
        // This can happen if the webhook failed or was delayed
        effectiveStatus = "expired"
        effectivePlan = "free"

        // Update the database to reflect the expired status
        await db.subscription.update({
          where: { userId: session.user.id },
          data: {
            status: "expired",
            plan: "free",
          },
        })
      }
    }

    // If status is past_due or canceled, the plan should be free
    if (effectiveStatus === "past_due" || effectiveStatus === "canceled") {
      effectivePlan = "free"
    }

    return NextResponse.json({
      plan: effectivePlan,
      status: effectiveStatus,
      currentPeriodStart: subscription.currentPeriodStart,
      currentPeriodEnd: subscription.currentPeriodEnd,
      cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
      stripeCustomerId: subscription.stripeCustomerId,
    })
  } catch (error) {
    console.error("Get subscription status error:", error)
    return NextResponse.json(
      { error: "Произошла ошибка при получении статуса подписки" },
      { status: 500 }
    )
  }
}
