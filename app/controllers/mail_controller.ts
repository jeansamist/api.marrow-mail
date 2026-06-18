import { MailService } from '#services/mail_service'
import MailTransformer from '#transformers/mail_transformer'
import { ApiResponse } from '#utils/api_response'
import { sendMailValidator } from '#validators/mail'
import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'

@inject()
export default class MailController {
  constructor(private readonly mailService: MailService) {}

  async send({ request, response, serialize }: HttpContext) {
    const data = await request.validateUsing(sendMailValidator)
    const mail = await this.mailService.sendMail(data)
    const serialized = await serialize(MailTransformer.transform(mail))
    return response.ok(ApiResponse.success(serialized.data, 'Mail queued for sending'))
  }

  async index({ response, serialize }: HttpContext) {
    const mails = await this.mailService.fetchAllMail()
    const serialized = await serialize(MailTransformer.transform(mails))
    return response.ok(ApiResponse.success(serialized.data, 'Mails retrieved'))
  }

  async sent({ response, serialize }: HttpContext) {
    const mails = await this.mailService.fetchAllSentMail()
    const serialized = await serialize(MailTransformer.transform(mails))
    return response.ok(ApiResponse.success(serialized.data, 'Sent mails retrieved'))
  }

  async received({ response, serialize }: HttpContext) {
    const mails = await this.mailService.fetchAllReceivedMail()
    const serialized = await serialize(MailTransformer.transform(mails))
    return response.ok(ApiResponse.success(serialized.data, 'Received mails retrieved'))
  }
}
