import { LoginAlertEmailTemplate } from '#email_templates/login_alert_email_template'
import type User from '#models/user'
import env from '#start/env'
import { BaseMail } from '@adonisjs/mail'
import { render } from '@react-email/render'

export default class LoginAlertNotification extends BaseMail {
  from = env.get('SMTP_USERNAME')
  subject = 'Security alert: New login detected'
  constructor(
    private user: User,
    private loggedInAt: string
  ) {
    super()
  }

  async prepare() {
    this.message.to(this.user.email)
    this.message.html(
      await render(
        LoginAlertEmailTemplate({
          firstName: this.user.firstName,
          loggedInAt: this.loggedInAt,
        })
      )
    )
  }
}
