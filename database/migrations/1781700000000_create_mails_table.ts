import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'mails'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')

      table
        .integer('mail_account_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('mail_accounts')
        .onDelete('CASCADE')

      table.string('from_email').notNullable()
      table.json('to_addresses').notNullable()
      table.json('cc_addresses').nullable()
      table.json('bcc_addresses').nullable()
      table.string('reply_to').nullable()
      table.string('subject').notNullable()
      table.text('body_html').nullable()
      table.text('body_text').nullable()

      // 'queued' | 'sent' | 'failed' | 'received'
      table.string('status', 20).notNullable().defaultTo('queued')
      // 'sent' | 'received'
      table.string('direction', 20).notNullable().defaultTo('sent')

      table.string('ses_message_id').nullable()

      // JSON array of File.id for future attachment support
      table.json('attachment_ids').nullable()

      table.timestamp('created_at')
      table.timestamp('updated_at')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
