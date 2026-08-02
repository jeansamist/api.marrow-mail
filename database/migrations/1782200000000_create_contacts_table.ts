import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'contacts'

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

      table.string('first_name').notNullable()
      table.string('last_name').nullable()
      table.string('email', 254).notNullable()
      table.string('phone').nullable()
      table.string('company').nullable()
      table.text('notes').nullable()

      table.unique(['mail_account_id', 'email'])

      table.timestamp('created_at')
      table.timestamp('updated_at')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
