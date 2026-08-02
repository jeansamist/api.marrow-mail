import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'signatures'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')

      table.string('name').nullable()
      table.string('job_title').nullable()
      table.boolean('include_photo').notNullable().defaultTo(false)
      table.string('phone').nullable()
      table.string('website').nullable()
      table.string('address').nullable()
      table.string('linkedin').nullable()
      table.string('facebook').nullable()
      table.string('instagram').nullable()
      table.boolean('include_in_new_emails').notNullable().defaultTo(true)
      table.boolean('include_in_replies').notNullable().defaultTo(true)

      table
        .integer('mail_account_id')
        .unsigned()
        .notNullable()
        .unique()
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
