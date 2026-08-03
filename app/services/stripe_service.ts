import env from '#start/env'
import Stripe from 'stripe'

export class StripeService {
  client = new Stripe(env.get('STRIPE_SECRET_KEY'))
}
