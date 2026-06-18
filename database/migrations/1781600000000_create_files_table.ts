import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'files'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')

      table.string('key').notNullable().unique()
      table.string('bucket').notNullable()
      table.string('original_name').notNullable()
      table.string('mime_type', 255).nullable()
      table.bigInteger('size').nullable()

      table
        .integer('mail_account_id')
        .unsigned()
        .references('id')
        .inTable('mail_accounts')
        .onDelete('CASCADE')

      table.timestamp('created_at')
      table.timestamp('updated_at')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
