import { TwoFactorStatusAlertEmailTemplate } from '#email_templates/two_factor_status_alert_email_template'
import env from '#start/env'
import { BaseMail } from '@adonisjs/mail'
import { render } from '@react-email/render'

export default class TwoFactorStatusAlertNotification extends BaseMail {
  from = env.get('MAIL_FROM_ADDRESS')

  constructor(
    private recipient: string,
    private mailAccountEmail: string,
    private enabled: boolean
  ) {
    super()
    this.subject = `Security alert: Two-factor authentication ${enabled ? 'enabled' : 'disabled'}`
  }

  async prepare() {
    this.message.to(this.recipient)
    this.message.html(
      await render(
        TwoFactorStatusAlertEmailTemplate({
          mailAccountEmail: this.mailAccountEmail,
          enabled: this.enabled,
        })
      )
    )
  }
}
