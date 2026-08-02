import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'mails'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.boolean('important').notNullable().defaultTo(false)
      table.boolean('is_spam').notNullable().defaultTo(false)
      table.boolean('deleted').notNullable().defaultTo(false)
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('important')
      table.dropColumn('is_spam')
      table.dropColumn('deleted')
    })
  }
}
