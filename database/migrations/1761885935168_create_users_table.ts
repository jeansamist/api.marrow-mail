import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'users'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').notNullable()
      table.string('first_name').notNullable()
      table.string('last_name').notNullable()
      table.string('avatar').nullable()

      table.string('email', 254).notNullable().unique()
      table.string('password').notNullable()

      table.string('reset_password_token').nullable()
      table.timestamp('reset_password_token_expires_at').nullable()

      table.boolean('email_verified').defaultTo(false).notNullable()
      table.timestamp('email_verified_at').nullable()
      table.string('email_verification_code').nullable()
      table.timestamp('email_verification_code_expires_at').nullable()

      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
