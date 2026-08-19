import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'mail_accounts'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.string('forwarding_email').nullable()
      table.boolean('forwarding_verified').notNullable().defaultTo(false)
      table.string('forwarding_verification_token').nullable()
      table.timestamp('forwarding_verification_token_expires_at').nullable()
      table.boolean('keep_forwarded_copy').notNullable().defaultTo(true)
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('forwarding_email')
      table.dropColumn('forwarding_verified')
      table.dropColumn('forwarding_verification_token')
      table.dropColumn('forwarding_verification_token_expires_at')
      table.dropColumn('keep_forwarded_copy')
    })
  }
}
