import { type RoleAliasSchema } from '#database/schema'
import RoleAlias from '#models/role_alias'
import { type ModelProps } from '#utils/generics'

export default class RoleAliasRepository {
  private model = RoleAlias

  async create(data: ModelProps<RoleAliasSchema>): Promise<RoleAlias> {
    return this.model.create(data)
  }

  async findById(id: number): Promise<RoleAlias | null> {
    return this.model.find(id)
  }

  async findByDomainId(domainId: number): Promise<RoleAlias[]> {
    return this.model.query().where('domain_id', domainId).orderBy('created_at', 'desc')
  }

  async findByDomainIdAndAlias(domainId: number, alias: string): Promise<RoleAlias | null> {
    return this.model.query().where('domain_id', domainId).where('alias', alias).first()
  }

  async findByDomainNameAndAlias(domainName: string, alias: string): Promise<RoleAlias | null> {
    return this.model
      .query()
      .where('alias', alias)
      .whereHas('domain', (query) => {
        query.andWhere('name', domainName)
      })
      .first()
  }

  async delete(roleAlias: RoleAlias): Promise<void> {
    await roleAlias.delete()
  }
}
