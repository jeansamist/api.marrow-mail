import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'mails'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      // Drafts can be saved before recipients/subject are filled in.
      table.json('to_addresses').nullable().alter()
      table.string('subject').nullable().alter()
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.json('to_addresses').notNullable().alter()
      table.string('subject').notNullable().alter()
    })
  }
}
