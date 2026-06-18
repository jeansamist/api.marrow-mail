import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'mail_accounts'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.string('reset_password_token').nullable()
      table.timestamp('reset_password_token_expires_at').nullable()
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('reset_password_token')
      table.dropColumn('reset_password_token_expires_at')
    })
  }
}
