import { ResetPasswordEmailTemplate } from '#email_templates/reset_password_email_template'
import type User from '#models/user'
import env from '#start/env'
import { BaseMail } from '@adonisjs/mail'
import { render } from '@react-email/render'

export default class PasswordResetNotification extends BaseMail {
  from = env.get('SMTP_USERNAME')
  subject = 'Recover your password'
  constructor(
    private user: User,
    private resetPasswordLink: string
  ) {
    super()
  }

  /**
   * The "prepare" method is called automatically when
   * the email is sent or queued.
   */
  async prepare() {
    this.message.to(this.user.email)
    this.message.html(
      await render(
        ResetPasswordEmailTemplate({
          firstName: this.user.firstName,
          resetPasswordLink: this.resetPasswordLink,
        })
      )
    )
  }
}
