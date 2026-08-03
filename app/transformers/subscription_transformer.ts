import type Subscription from '#models/subscription'
import { BaseTransformer } from '@adonisjs/core/transformers'

export default class SubscriptionTransformer extends BaseTransformer<Subscription> {
  toObject() {
    return this.pick(this.resource, [
      'id',
      'provider',
      'status',
      'planId',
      'mailboxQuantity',
      'billingMonths',
      'currency',
      'amountTotal',
      'currentPeriodEnd',
      'createdAt',
      'updatedAt',
    ])
  }
}
