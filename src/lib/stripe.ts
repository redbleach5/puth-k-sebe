import Stripe from "stripe"

// Singleton Stripe instance — avoids creating a new instance on every API call
// Lazily created to avoid build errors when STRIPE_SECRET_KEY is not set
// Stripe v22: don't set apiVersion to use the latest

const globalForStripe = globalThis as unknown as {
  stripe: Stripe | undefined
}

function createStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) {
    throw new Error("STRIPE_SECRET_KEY environment variable is not set")
  }
  return new Stripe(key)
}

export function getStripe(): Stripe {
  if (!globalForStripe.stripe) {
    globalForStripe.stripe = createStripe()
  }
  return globalForStripe.stripe
}
