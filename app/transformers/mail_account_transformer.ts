import type MailAccount from '#models/mail_account'
import { BaseTransformer } from '@adonisjs/core/transformers'

export default class MailAccountTransformer extends BaseTransformer<MailAccount> {
  toObject() {
    return this.pick(this.resource, ['id', 'email', 'username', 'ownerEmail'])
  }
}
