import { StripeService } from '#services/stripe_service'
import { BaseCommand } from '@adonisjs/core/ace'
import type { CommandOptions } from '@adonisjs/core/types/ace'

const PLANS = [
  { planId: 'core', name: 'Core Plan' },
  { planId: 'plus', name: 'Plus Plan' },
] as const

export default class SeedStripeProducts extends BaseCommand {
  static commandName = 'seed:stripe-products'
  static description =
    'Idempotently create the Core/Plus Stripe Products used by mailbox subscription checkout'
  static options: CommandOptions = {}

  async run() {
    const stripeService = await this.app.container.make(StripeService)

    for (const plan of PLANS) {
      const existing = await stripeService.client.products.search({
        query: `active:'true' AND metadata['plan_id']:'${plan.planId}'`,
      })

      if (existing.data[0]) {
        this.logger.info(`${plan.name} already exists: ${existing.data[0].id}`)
        continue
      }

      const product = await stripeService.client.products.create({
        name: plan.name,
        metadata: { plan_id: plan.planId },
      })

      this.logger.info(
        `Created ${plan.name}: ${product.id} — set STRIPE_PRODUCT_${plan.planId.toUpperCase()}_ID=${product.id} in .env`
      )
    }
  }
}
