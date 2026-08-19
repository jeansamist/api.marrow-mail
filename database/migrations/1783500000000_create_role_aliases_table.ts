import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'role_aliases'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.integer('domain_id').unsigned().notNullable()
        .references('id').inTable('domains').onDelete('CASCADE')
      table.string('alias').notNullable()
      table.integer('mail_account_id').unsigned().notNullable()
        .references('id').inTable('mail_accounts').onDelete('CASCADE')
      table.unique(['domain_id', 'alias'])
      table.timestamp('created_at')
      table.timestamp('updated_at')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
