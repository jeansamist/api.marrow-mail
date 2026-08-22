import { SubscriptionService } from '#services/subscription_service'
import SubscriptionTransformer from '#transformers/subscription_transformer'
import { ApiResponse } from '#utils/api_response'
import {
  changeSubscriptionPlanValidator,
  checkoutSubscriptionValidator,
  upgradeSubscriptionValidator,
} from '#validators/subscription'
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

  async changePlan({ params, request, response, serialize }: HttpContext) {
    const data = await request.validateUsing(changeSubscriptionPlanValidator)
    const subscription = await this.subscriptionService.changePlan(
      Number(params.id),
      data.planId,
      data.currentPassword
    )
    const serialized = await serialize(SubscriptionTransformer.transform(subscription))
    return response.ok(ApiResponse.success(serialized.data, 'Plan change scheduled'))
  }

  async upgradeCheckout({ params, request, response, serialize }: HttpContext) {
    const data = await request.validateUsing(upgradeSubscriptionValidator)
    const result = await this.subscriptionService.initiateUpgrade(
      Number(params.id),
      data.planId,
      data.paymentMethod,
      data.customerPhone
    )
    const serialized = await serialize(SubscriptionTransformer.transform(result.subscription))
    return response.ok(
      ApiResponse.success(
        { ...serialized.data, ...result.providerPayload },
        'Upgrade checkout created'
      )
    )
  }

  async cancel({ params, response, serialize }: HttpContext) {
    const subscription = await this.subscriptionService.cancelSubscription(Number(params.id))
    const serialized = await serialize(SubscriptionTransformer.transform(subscription))
    return response.ok(ApiResponse.success(serialized.data, 'Subscription canceled'))
  }

  async reactivate({ params, response, serialize }: HttpContext) {
    const subscription = await this.subscriptionService.reactivateSubscription(Number(params.id))
    const serialized = await serialize(SubscriptionTransformer.transform(subscription))
    return response.ok(ApiResponse.success(serialized.data, 'Subscription reactivated'))
  }
}
