import { MailAccountsCreatedBatchEmailTemplate } from '#email_templates/mail_accounts_created_batch_email_template'
import env from '#start/env'
import { BaseMail } from '@adonisjs/mail'
import { render } from '@react-email/render'

interface MailAccountEntry {
  mailAccountEmail: string
  setupLink: string
}

export default class MailAccountsCreatedBatchNotification extends BaseMail {
  from = env.get('MAIL_FROM_ADDRESS')
  subject: string

  constructor(
    private ownerEmail: string,
    private accounts: MailAccountEntry[]
  ) {
    super()
    this.subject =
      this.accounts.length > 1
        ? `${this.accounts.length} mail accounts are ready to set up`
        : 'Your mail account is ready to set up'
  }

  async prepare() {
    this.message.to(this.ownerEmail)
    this.message.html(
      await render(MailAccountsCreatedBatchEmailTemplate({ accounts: this.accounts }))
    )
  }
}
