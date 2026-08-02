import type Contact from '#models/contact'
import { BaseTransformer } from '@adonisjs/core/transformers'

export default class ContactTransformer extends BaseTransformer<Contact> {
  toObject() {
    return this.pick(this.resource, [
      'id',
      'mailAccountId',
      'firstName',
      'lastName',
      'email',
      'phone',
      'company',
      'notes',
      'createdAt',
      'updatedAt',
    ])
  }
}
