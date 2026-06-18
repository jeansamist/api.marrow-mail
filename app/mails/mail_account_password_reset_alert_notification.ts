import { MailAccountPasswordResetAlertEmailTemplate } from '#email_templates/mail_account_password_reset_alert_email_template'
import env from '#start/env'
import { BaseMail } from '@adonisjs/mail'
import { render } from '@react-email/render'

export default class MailAccountPasswordResetAlertNotification extends BaseMail {
  from = env.get('SMTP_USERNAME')
  subject = 'Security alert: Mail account password changed'

  constructor(
    private recipient: string,
    private mailAccountEmail: string,
    private resetAt: string
  ) {
    super()
  }

  async prepare() {
    this.message.to(this.recipient)
    this.message.html(
      await render(
        MailAccountPasswordResetAlertEmailTemplate({
          mailAccountEmail: this.mailAccountEmail,
          resetAt: this.resetAt,
        })
      )
    )
  }
}
