import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'domains'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      // e.g. "mail.customer-domain.com" pointed at our edge via an A record.
      table.string('custom_login_hostname').nullable().unique()
      table.boolean('custom_login_hostname_verified').notNullable().defaultTo(false)
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('custom_login_hostname')
      table.dropColumn('custom_login_hostname_verified')
    })
  }
}
