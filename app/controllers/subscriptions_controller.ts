import { SubscriptionService } from '#services/subscription_service'
import SubscriptionTransformer from '#transformers/subscription_transformer'
import { ApiResponse } from '#utils/api_response'
import { checkoutSubscriptionValidator } from '#validators/subscription'
import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'

@inject()
export default class SubscriptionsController {
  constructor(private readonly subscriptionService: SubscriptionService) {}

  async checkout({ request, response, serialize }: HttpContext) {
    const data = await request.validateUsing(checkoutSubscriptionValidator)
    const result = await this.subscriptionService.checkout(data, request.ip())
    const serialized = await serialize(SubscriptionTransformer.transform(result.subscription))
    return response.ok(
      ApiResponse.success({ ...serialized.data, ...result.providerPayload }, 'Checkout created')
    )
  }

  async status({ params, response, serialize }: HttpContext) {
    const subscription = await this.subscriptionService.getStatus(Number(params.id))
    const serialized = await serialize(SubscriptionTransformer.transform(subscription))
    return response.ok(ApiResponse.success(serialized.data, 'Subscription status'))
  }

  async current({ response, serialize }: HttpContext) {
    const subscription = await this.subscriptionService.getCurrentForUser()
    if (!subscription) {
      return response.ok(ApiResponse.success(null, 'No subscription found'))
    }
    const serialized = await serialize(SubscriptionTransformer.transform(subscription))
    return response.ok(ApiResponse.success(serialized.data, 'Current subscription retrieved'))
  }
}
