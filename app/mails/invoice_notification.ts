import { InvoiceEmailTemplate } from '#email_templates/invoice_email_template'
import env from '#start/env'
import { BaseMail } from '@adonisjs/mail'
import { render } from '@react-email/render'

export default class InvoiceNotification extends BaseMail {
  from = env.get('SMTP_USERNAME')

  constructor(
    private recipientEmail: string,
    private firstName: string,
    private invoiceNumber: string,
    private description: string,
    private totalFormatted: string,
    private pdfBuffer: Buffer
  ) {
    super()
    this.subject = `Your MarrowMail invoice ${invoiceNumber}`
  }

  async prepare() {
    this.message.to(this.recipientEmail)
    this.message.html(
      await render(
        InvoiceEmailTemplate({
          firstName: this.firstName,
          invoiceNumber: this.invoiceNumber,
          description: this.description,
          totalFormatted: this.totalFormatted,
        })
      )
    )
    this.message.attachData(this.pdfBuffer, {
      filename: `${this.invoiceNumber}.pdf`,
      contentType: 'application/pdf',
    })
  }
}
