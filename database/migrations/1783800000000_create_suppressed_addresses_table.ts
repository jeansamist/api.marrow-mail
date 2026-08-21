import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'suppressed_addresses'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')

      table.string('email').notNullable().unique()
      table.string('reason').notNullable() // 'bounce' | 'complaint'
      table.string('bounce_type').nullable() // 'Permanent' | 'Transient' | 'Undetermined', bounces only
      table.timestamp('last_event_at').notNullable()

      table.timestamp('created_at')
      table.timestamp('updated_at')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
