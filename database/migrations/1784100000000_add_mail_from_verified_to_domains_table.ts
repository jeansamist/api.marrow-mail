import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'domains'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      // Tracks SES's MailFromDomainStatus separately from `verified` (which
      // only reflects DKIM/sending status). A domain can be `verified` and
      // sending mail while its MAIL FROM subdomain's own MX+SPF records are
      // still missing — that's a silent deliverability problem (broken SPF/
      // DMARC alignment), not a reason to block sending, so it's tracked
      // independently rather than folded into `verified`.
      table.boolean('mail_from_verified').notNullable().defaultTo(false)
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('mail_from_verified')
    })
  }
}
