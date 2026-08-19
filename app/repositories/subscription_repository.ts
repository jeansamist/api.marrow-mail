import { type SubscriptionSchema } from '#database/schema'
import Subscription from '#models/subscription'
import { type ModelProps } from '#utils/generics'

export default class SubscriptionRepository {
  private model = Subscription

  async create(data: ModelProps<SubscriptionSchema>): Promise<Subscription> {
    return this.model.create(data)
  }

  async findById(id: number): Promise<Subscription | null> {
    return this.model.find(id)
  }

  async findByStripeSubscriptionId(stripeSubscriptionId: string): Promise<Subscription | null> {
    return this.model.query().where('stripe_subscription_id', stripeSubscriptionId).first()
  }

  async findLatestActiveForUser(userId: number): Promise<Subscription | null> {
    return this.model
      .query()
      .where('user_id', userId)
      .where('status', 'active')
      .orderBy('created_at', 'desc')
      .first()
  }

  async findAllActiveForUser(userId: number): Promise<Subscription[]> {
    return this.model.query().where('user_id', userId).where('status', 'active')
  }

  async findLatestForUser(userId: number): Promise<Subscription | null> {
    return this.model.query().where('user_id', userId).orderBy('created_at', 'desc').first()
  }

  async update(
    subscription: Subscription,
    data: Partial<ModelProps<SubscriptionSchema>>
  ): Promise<Subscription> {
    return subscription.merge(data).save()
  }
}
