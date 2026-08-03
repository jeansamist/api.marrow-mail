import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'subscriptions'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')

      table
        .integer('user_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('users')
        .onDelete('CASCADE')

      table.string('provider', 20).notNullable() // 'stripe' | 'elgiopay'
      table.string('plan_id', 10).notNullable() // 'core' | 'plus'

      table.integer('mailbox_quantity').unsigned().notNullable()
      table.integer('billing_months').unsigned().notNullable() // 1 | 3 | 6 | 12

      table.string('country_code', 2).nullable()
      table.string('currency', 3).notNullable()
      table.integer('amount_total').unsigned().notNullable()

      table.string('status', 20).notNullable().defaultTo('pending')
      table.timestamp('current_period_end').nullable()

      table.string('stripe_customer_id').nullable()
      table.string('stripe_subscription_id').nullable().unique()

      table.timestamp('created_at')
      table.timestamp('updated_at')

      table.index(['user_id'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
