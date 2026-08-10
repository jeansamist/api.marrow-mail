import type Domain from '#models/domain'
import { BaseTransformer } from '@adonisjs/core/transformers'

export default class DomainTransformer extends BaseTransformer<Domain> {
  toObject() {
    return this.pick(this.resource, ['id', 'name', 'description', 'verified', 'createdAt', 'updatedAt'])
  }
}
