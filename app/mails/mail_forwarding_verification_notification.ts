import { MailForwardingVerificationEmailTemplate } from '#email_templates/mail_forwarding_verification_email_template'
import env from '#start/env'
import { BaseMail } from '@adonisjs/mail'
import { render } from '@react-email/render'

export default class MailForwardingVerificationNotification extends BaseMail {
  from = env.get('MAIL_FROM_ADDRESS')
  subject = 'Confirm your mail forwarding address'

  constructor(
    private recipient: string,
    private mailAccountEmail: string,
    private verificationLink: string
  ) {
    super()
  }

  async prepare() {
    this.message.to(this.recipient)
    this.message.html(
      await render(
        MailForwardingVerificationEmailTemplate({
          mailAccountEmail: this.mailAccountEmail,
          verificationLink: this.verificationLink,
        })
      )
    )
  }
}
