import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'mails'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.boolean('is_read').notNullable().defaultTo(true)
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('is_read')
    })
  }
}
