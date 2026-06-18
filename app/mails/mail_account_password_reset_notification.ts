import { MailAccountResetPasswordEmailTemplate } from '#email_templates/mail_account_reset_password_email_template'
import env from '#start/env'
import { BaseMail } from '@adonisjs/mail'
import { render } from '@react-email/render'

export default class MailAccountPasswordResetNotification extends BaseMail {
  from = env.get('SMTP_USERNAME')
  subject = 'Reset your mail account password'

  constructor(
    private recipient: string,
    private mailAccountEmail: string,
    private resetPasswordLink: string
  ) {
    super()
  }

  async prepare() {
    this.message.to(this.recipient)
    this.message.html(
      await render(
        MailAccountResetPasswordEmailTemplate({
          mailAccountEmail: this.mailAccountEmail,
          resetPasswordLink: this.resetPasswordLink,
        })
      )
    )
  }
}
