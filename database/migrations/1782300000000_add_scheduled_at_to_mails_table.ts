import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'mails'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      // Set when status = 'scheduled'; the scheduler cron dispatches mail
      // once this timestamp has passed.
      table.timestamp('scheduled_at').nullable()
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('scheduled_at')
    })
  }
}
