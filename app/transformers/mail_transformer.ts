import type Mail from '#models/mail'
import { BaseTransformer } from '@adonisjs/core/transformers'

export default class MailTransformer extends BaseTransformer<Mail> {
  toObject() {
    return this.pick(this.resource, [
      'id',
      'mailAccountId',
      'fromEmail',
      'toAddresses',
      'ccAddresses',
      'bccAddresses',
      'replyTo',
      'subject',
      'bodyHtml',
      'bodyText',
      'status',
      'direction',
      'sesMessageId',
      'attachmentIds',
      'createdAt',
      'updatedAt',
    ])
  }
}
