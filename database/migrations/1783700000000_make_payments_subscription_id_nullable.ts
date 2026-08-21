import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'payments'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      // Domain purchases are a subscription-independent one-off charge —
      // they can happen before the customer has picked a mailbox plan.
      table.integer('subscription_id').unsigned().nullable().alter()
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.integer('subscription_id').unsigned().notNullable().alter()
    })
  }
}
