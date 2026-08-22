import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'files'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      // 'file' (default) or 'voice_note'. A voice note is never attached raw
      // to an outgoing email — it's linked to via publicToken instead.
      table.string('kind').notNullable().defaultTo('file')
      // Opaque, unguessable id used by the unauthenticated voice-note
      // playback page. Only ever set for kind='voice_note'.
      table.string('public_token').nullable().unique()
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('public_token')
      table.dropColumn('kind')
    })
  }
}
