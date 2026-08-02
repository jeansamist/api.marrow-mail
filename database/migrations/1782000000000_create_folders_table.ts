import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'folders'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')

      table.string('name').notNullable()

      table
        .integer('mail_account_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('mail_accounts')
        .onDelete('CASCADE')

      table.unique(['mail_account_id', 'name'])

      table.timestamp('created_at')
      table.timestamp('updated_at')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
