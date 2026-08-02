import type Signature from '#models/signature'
import { BaseTransformer } from '@adonisjs/core/transformers'

export default class SignatureTransformer extends BaseTransformer<Signature> {
  toObject() {
    return this.pick(this.resource, [
      'id',
      'mailAccountId',
      'name',
      'jobTitle',
      'includePhoto',
      'phone',
      'website',
      'address',
      'linkedin',
      'facebook',
      'instagram',
      'includeInNewEmails',
      'includeInReplies',
      'createdAt',
      'updatedAt',
    ])
  }
}
