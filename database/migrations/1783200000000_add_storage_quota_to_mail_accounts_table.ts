import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'mail_accounts'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      // Null means "use the plan default" rather than an explicit quota.
      table.bigInteger('storage_quota_bytes').nullable()
      table.boolean('active').notNullable().defaultTo(true)
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('storage_quota_bytes')
      table.dropColumn('active')
    })
  }
}
