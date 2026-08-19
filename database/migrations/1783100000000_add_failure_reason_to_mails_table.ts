import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'mails'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      // Populated when status transitions to 'failed', e.g. the raw SES rejection reason.
      table.text('failure_reason').nullable()
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('failure_reason')
    })
  }
}
