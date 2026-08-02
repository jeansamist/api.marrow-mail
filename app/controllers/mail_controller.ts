import { MailService } from '#services/mail_service'
import MailTransformer from '#transformers/mail_transformer'
import { ApiResponse } from '#utils/api_response'
import {
  draftMailValidator,
  forwardMailValidator,
  markImportantValidator,
  markSpamValidator,
  moveMailToFolderValidator,
  rescheduleMailValidator,
  scheduleMailValidator,
  sendMailValidator,
} from '#validators/mail'
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

  async drafts({ response, serialize }: HttpContext) {
    const mails = await this.mailService.fetchDrafts()
    const serialized = await serialize(MailTransformer.transform(mails))
    return response.ok(ApiResponse.success(serialized.data, 'Drafts retrieved'))
  }

  async saveDraft({ request, response, serialize }: HttpContext) {
    const data = await request.validateUsing(draftMailValidator)
    const draft = await this.mailService.saveDraft(data)
    const serialized = await serialize(MailTransformer.transform(draft))
    return response.created(ApiResponse.success(serialized.data, 'Draft saved'))
  }

  async updateDraft({ params, request, response, serialize }: HttpContext) {
    const data = await request.validateUsing(draftMailValidator)
    const draft = await this.mailService.updateDraft(params.id, data)
    const serialized = await serialize(MailTransformer.transform(draft))
    return response.ok(ApiResponse.success(serialized.data, 'Draft updated'))
  }

  async deleteDraft({ params, response }: HttpContext) {
    await this.mailService.deleteDraft(params.id)
    return response.ok(ApiResponse.success(null, 'Draft deleted'))
  }

  async sendDraft({ params, response, serialize }: HttpContext) {
    const mail = await this.mailService.sendDraft(params.id)
    const serialized = await serialize(MailTransformer.transform(mail))
    return response.ok(ApiResponse.success(serialized.data, 'Draft queued for sending'))
  }

  async moveToFolder({ params, request, response, serialize }: HttpContext) {
    const { folderId } = await request.validateUsing(moveMailToFolderValidator)
    const mail = await this.mailService.moveToFolder(params.id, folderId)
    const serialized = await serialize(MailTransformer.transform(mail))
    return response.ok(ApiResponse.success(serialized.data, 'Mail moved'))
  }

  async markSpam({ params, request, response, serialize }: HttpContext) {
    const { isSpam } = await request.validateUsing(markSpamValidator)
    const mail = await this.mailService.markSpam(params.id, isSpam)
    const serialized = await serialize(MailTransformer.transform(mail))
    return response.ok(
      ApiResponse.success(serialized.data, isSpam ? 'Marked as spam' : 'Marked as not spam')
    )
  }

  async markImportant({ params, request, response, serialize }: HttpContext) {
    const { important } = await request.validateUsing(markImportantValidator)
    const mail = await this.mailService.markImportant(params.id, important)
    const serialized = await serialize(MailTransformer.transform(mail))
    return response.ok(
      ApiResponse.success(serialized.data, important ? 'Marked as important' : 'Unstarred')
    )
  }

  async forward({ params, request, response, serialize }: HttpContext) {
    const data = await request.validateUsing(forwardMailValidator)
    const mail = await this.mailService.forwardMail(params.id, data)
    const serialized = await serialize(MailTransformer.transform(mail))
    return response.ok(ApiResponse.success(serialized.data, 'Mail forwarded'))
  }

  async scheduled({ response, serialize }: HttpContext) {
    const mails = await this.mailService.fetchScheduledMails()
    const serialized = await serialize(MailTransformer.transform(mails))
    return response.ok(ApiResponse.success(serialized.data, 'Scheduled mails retrieved'))
  }

  async scheduleMail({ request, response, serialize }: HttpContext) {
    const data = await request.validateUsing(scheduleMailValidator)
    const mail = await this.mailService.scheduleMail(data)
    const serialized = await serialize(MailTransformer.transform(mail))
    return response.created(ApiResponse.success(serialized.data, 'Mail scheduled'))
  }

  async reschedule({ params, request, response, serialize }: HttpContext) {
    const { scheduledAt } = await request.validateUsing(rescheduleMailValidator)
    const mail = await this.mailService.rescheduleMail(params.id, scheduledAt)
    const serialized = await serialize(MailTransformer.transform(mail))
    return response.ok(ApiResponse.success(serialized.data, 'Mail rescheduled'))
  }

  async cancelSchedule({ params, response, serialize }: HttpContext) {
    const mail = await this.mailService.cancelScheduledMail(params.id)
    const serialized = await serialize(MailTransformer.transform(mail))
    return response.ok(ApiResponse.success(serialized.data, 'Scheduled send canceled'))
  }
}
