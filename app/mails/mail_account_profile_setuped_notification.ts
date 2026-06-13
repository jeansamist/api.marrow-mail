import { MailAccountProfileSetupedEmailTemplate } from '#email_templates/mail_account_profile_setuped_email_template'
import env from '#start/env'
import { BaseMail } from '@adonisjs/mail'
import { render } from '@react-email/render'

export default class MailAccountProfileSetupedNotification extends BaseMail {
  from = env.get('SMTP_USERNAME')
  subject = 'Your mail account profile has been set up'

  constructor(
    private ownerEmail: string,
    private mailAccountEmail: string,
    private firstName: string
  ) {
    super()
  }

  async prepare() {
    this.message.to(this.ownerEmail)
    this.message.html(
      await render(
        MailAccountProfileSetupedEmailTemplate({
          firstName: this.firstName,
          mailAccountEmail: this.mailAccountEmail,
        })
      )
    )
  }
}
