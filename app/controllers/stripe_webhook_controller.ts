import { SubscriptionService } from '#services/subscription_service'
import { StripeService } from '#services/stripe_service'
import env from '#start/env'
import { inject } from '@adonisjs/core'
import { Logger } from '@adonisjs/core/logger'
import type { HttpContext } from '@adonisjs/core/http'

@inject()
export default class StripeWebhookController {
  constructor(
    private readonly subscriptionService: SubscriptionService,
    private readonly stripeService: StripeService,
    private readonly logger: Logger
  ) {}

  async handle({ request, response }: HttpContext) {
    const rawBody = request.raw()
    const signature = request.header('stripe-signature')

    if (!rawBody || !signature) {
      return response.badRequest({ error: 'Missing signature' })
    }

    let event
    try {
      event = this.stripeService.client.webhooks.constructEvent(
        rawBody,
        signature,
        env.get('STRIPE_WEBHOOK_SECRET')
      )
    } catch (error) {
      this.logger.warn(
        `Stripe webhook signature verification failed: ${error instanceof Error ? error.message : String(error)}`
      )
      return response.forbidden({ error: 'Invalid signature' })
    }

    await this.subscriptionService.applyStripeWebhookEvent(event)

    return response.ok({ received: true })
  }
}
