import type DomainBranding from '#models/domain_branding'
import { BaseTransformer } from '@adonisjs/core/transformers'

export default class DomainBrandingTransformer extends BaseTransformer<DomainBranding> {
  toObject() {
    return this.pick(this.resource, [
      'id',
      'domainId',
      'companyName',
      'welcomeMessage',
      'accentColor',
      'logoFileId',
      'createdAt',
      'updatedAt',
    ])
  }
}
