import { type PaymentSchema } from '#database/schema'
import Payment from '#models/payment'
import { type ModelProps } from '#utils/generics'

export default class PaymentRepository {
  private model = Payment

  async create(data: ModelProps<PaymentSchema>): Promise<Payment> {
    return this.model.create(data)
  }

  async findByProviderTransactionId(providerTransactionId: string): Promise<Payment | null> {
    return this.model.query().where('provider_transaction_id', providerTransactionId).first()
  }

  async findLatestForSubscription(subscriptionId: number): Promise<Payment | null> {
    return this.model
      .query()
      .where('subscription_id', subscriptionId)
      .orderBy('created_at', 'desc')
      .first()
  }

  async update(payment: Payment, data: Partial<ModelProps<PaymentSchema>>): Promise<Payment> {
    return payment.merge(data).save()
  }
}
