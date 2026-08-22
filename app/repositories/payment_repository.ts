import { type PaymentSchema } from '#database/schema'
import Payment from '#models/payment'
import { type ModelProps } from '#utils/generics'

export default class PaymentRepository {
  private model = Payment

  async create(data: ModelProps<PaymentSchema>): Promise<Payment> {
    return this.model.create(data)
  }

  async findById(id: number): Promise<Payment | null> {
    return this.model.find(id)
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

  /**
   * Atomically transitions a payment from pending to completed, returning
   * whether THIS call performed the transition. Payment confirmation is
   * reachable from more than one path at once (the frontend's status-polling
   * loop and the provider's webhook can both observe "succeeded" around the
   * same time) — a plain read-then-write update() lets both callers read
   * status:'pending' before either commits, so both would fire a side effect
   * like sending an invoice. The WHERE clause below makes Postgres's row
   * lock the tie-breaker: only one UPDATE can match status='pending'.
   */
  async markCompletedIfPending(paymentId: number): Promise<boolean> {
    const rows = await this.model
      .query()
      .where('id', paymentId)
      .where('status', 'pending')
      .update({ status: 'completed' }, ['id'])
    return rows.length > 0
  }
}
