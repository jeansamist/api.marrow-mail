import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'payments'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')

      table
        .integer('subscription_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('subscriptions')
        .onDelete('CASCADE')

      table.string('provider', 20).notNullable() // 'stripe' | 'elgiopay'
      table.string('provider_transaction_id').nullable()

      table.integer('amount').unsigned().notNullable()
      table.string('currency', 3).notNullable()

      table.string('status', 20).notNullable().defaultTo('pending')

      table.string('customer_phone').nullable()
      table.string('failure_reason').nullable()
      table.json('raw_response').nullable()

      table.timestamp('created_at')
      table.timestamp('updated_at')

      table.index(['subscription_id'])
      table.index(['provider_transaction_id'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
