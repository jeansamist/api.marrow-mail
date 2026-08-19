import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'mail_accounts'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      // AES-256-GCM ciphertext (via @adonisjs/core/encryption), never stored in plaintext.
      table.text('two_factor_secret').nullable()
      table.boolean('two_factor_enabled').notNullable().defaultTo(false)
      // JSON array of scrypt-hashed backup codes, same hashing as the password column.
      table.json('two_factor_backup_codes').nullable()
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('two_factor_secret')
      table.dropColumn('two_factor_enabled')
      table.dropColumn('two_factor_backup_codes')
    })
  }
}
