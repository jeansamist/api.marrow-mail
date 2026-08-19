import { type DomainBrandingSchema } from '#database/schema'
import DomainBranding from '#models/domain_branding'
import { type ModelProps } from '#utils/generics'

export default class DomainBrandingRepository {
  private model = DomainBranding

  async create(data: ModelProps<DomainBrandingSchema>): Promise<DomainBranding> {
    return this.model.create(data)
  }

  async findByDomainId(domainId: number): Promise<DomainBranding | null> {
    return this.model.query().where('domain_id', domainId).first()
  }

  async update(
    branding: DomainBranding,
    data: Partial<ModelProps<DomainBrandingSchema>>
  ): Promise<DomainBranding> {
    return branding.merge(data).save()
  }
}
