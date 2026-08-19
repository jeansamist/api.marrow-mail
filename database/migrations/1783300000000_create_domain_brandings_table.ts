import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'domain_brandings'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.integer('domain_id').unsigned().notNullable().unique()
        .references('id').inTable('domains').onDelete('CASCADE')
      table.string('company_name').nullable()
      table.text('welcome_message').nullable()
      table.integer('logo_file_id').unsigned().nullable()
        .references('id').inTable('files').onDelete('SET NULL')
      table.string('accent_color').nullable()
      table.timestamp('created_at')
      table.timestamp('updated_at')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
