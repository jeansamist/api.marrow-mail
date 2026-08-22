import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'subscriptions'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      // Set while a plan change is in flight: a downgrade waiting for
      // currentPeriodEnd, or an upgrade waiting on pendingCheckoutPaymentId.
      table.string('pending_plan_id').nullable()
      // Present only for an upgrade — the one-off payment that must complete
      // before pendingPlanId is applied. Null for a scheduled downgrade.
      table
        .integer('pending_checkout_payment_id')
        .unsigned()
        .nullable()
        .references('id')
        .inTable('payments')
        .onDelete('SET NULL')
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('pending_checkout_payment_id')
      table.dropColumn('pending_plan_id')
    })
  }
}
