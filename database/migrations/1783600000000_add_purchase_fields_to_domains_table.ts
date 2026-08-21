import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'domains'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table
        .enum('registration_status', [
          'not_purchased',
          'pending_payment',
          'pending_registration',
          'registered',
          'failed',
        ])
        .notNullable()
        .defaultTo('not_purchased')
      table.string('registration_operation_id').nullable()
      table.jsonb('registrant_contact').nullable()
      table.string('hosted_zone_id').nullable()
      table.timestamp('purchased_at').nullable()
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('registration_status')
      table.dropColumn('registration_operation_id')
      table.dropColumn('registrant_contact')
      table.dropColumn('hosted_zone_id')
      table.dropColumn('purchased_at')
    })
  }
}
