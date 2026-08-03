import { ElgiopayService } from '#services/elgiopay_service'
import { SubscriptionService } from '#services/subscription_service'
import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'

@inject()
export default class ElgiopayWebhookController {
  constructor(
    private readonly subscriptionService: SubscriptionService,
    private readonly elgiopayService: ElgiopayService
  ) {}

  async handle({ request, response }: HttpContext) {
    const rawBody = request.raw() ?? ''
    const signature = request.header('x-elgiopay-signature') ?? ''

    if (!this.elgiopayService.verifySignature(rawBody, signature)) {
      return response.forbidden({ error: 'Invalid signature' })
    }

    const envelope = request.body() as {
      id: string
      event: string
      created: number
      data: { transaction_id?: string; id?: string; message?: string }
    }

    await this.subscriptionService.applyElgiopayWebhookEvent(envelope)

    return response.ok({ received: true })
  }
}
