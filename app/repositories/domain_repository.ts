import Domain from '#models/domain'
import { type ModelProps } from '#utils/generics'
import { type TransactionClientContract } from '@adonisjs/lucid/types/database'
export default class DomainRepository {
  private model = Domain
  get getModel(): typeof Domain {
    return this.model
  }
  async create(data: ModelProps<Domain>, trx?: TransactionClientContract): Promise<Domain> {
    const domain = new this.model()
    if (trx) {
      domain.useTransaction(trx)
    }
    domain.fill(data)
    await domain.save()
    return domain
  }
  async findById(id: number): Promise<Domain | null> {
    return this.model.find(id)
  }
  async update(
    domain: Domain,
    data: Partial<ModelProps<Domain>>,
    trx?: TransactionClientContract
  ): Promise<Domain> {
    if (trx) {
      domain.useTransaction(trx)
    }
    return domain.merge(data).save()
  }

  async findAllNotVerified(): Promise<Domain[]> {
    const domains = this.model.findManyBy('verified', false)
    return domains
  }

  async delete(domain: Domain) {
    return domain.delete()
  }
}
