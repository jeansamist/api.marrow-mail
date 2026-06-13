import type MailAccountProfile from '#models/mail_account_profile'
import { BaseTransformer } from '@adonisjs/core/transformers'

export default class MailAccountProfileTransformer extends BaseTransformer<MailAccountProfile> {
  toObject() {
    return this.pick(this.resource, [
      'id',
      'firstName',
      'lastName',
      'avatar',
      'mailAccountId',
      'createdAt',
      'updatedAt',
    ])
  }
}
