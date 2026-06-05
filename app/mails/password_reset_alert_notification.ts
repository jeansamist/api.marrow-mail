import { PasswordResetAlertEmailTemplate } from '#email_templates/password_reset_alert_email_template'
import type User from '#models/user'
import env from '#start/env'
import { BaseMail } from '@adonisjs/mail'
import { render } from '@react-email/render'

export default class PasswordResetAlertNotification extends BaseMail {
  from = env.get('SMTP_USERNAME')
  subject = 'Security alert: Password changed'
  constructor(
    private user: User,
    private resetAt: string
  ) {
    super()
  }

  async prepare() {
    this.message.to(this.user.email)
    this.message.html(
      await render(
        PasswordResetAlertEmailTemplate({
          firstName: this.user.firstName,
          resetAt: this.resetAt,
        })
      )
    )
  }
}
