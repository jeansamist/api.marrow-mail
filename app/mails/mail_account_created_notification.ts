import { MailAccountCreatedEmailTemplate } from '#email_templates/mail_account_created_email_template'
import env from '#start/env'
import { BaseMail } from '@adonisjs/mail'
import { render } from '@react-email/render'

export default class MailAccountCreatedNotification extends BaseMail {
  from = env.get('SMTP_USERNAME')
  subject = 'Your mail account is ready to set up'

  constructor(
    private ownerEmail: string,
    private mailAccountEmail: string,
    private setupLink: string
  ) {
    super()
  }

  async prepare() {
    this.message.to(this.ownerEmail)
    this.message.html(
      await render(
        MailAccountCreatedEmailTemplate({
          mailAccountEmail: this.mailAccountEmail,
          setupLink: this.setupLink,
        })
      )
    )
  }
}
