import MailAccountRepository from '#repositories/mail_account_repository'
import RoleAliasRepository from '#repositories/role_alias_repository'
import { DomainService } from '#services/domain_service'
import { httpError } from '#utils/http_error'
import { inject } from '@adonisjs/core'

interface CreateRoleAliasPayload {
  alias: string
  mailAccountId: number
}

@inject()
export class RoleAliasService {
  constructor(
    private readonly repository: RoleAliasRepository,
    private readonly mailAccountRepository: MailAccountRepository,
    private readonly domainService: DomainService
  ) {}

  async listForDomain(domainId: number) {
    await this.assertOwnedDomain(domainId)
    return this.repository.findByDomainId(domainId)
  }

  async create(domainId: number, data: CreateRoleAliasPayload) {
    await this.assertOwnedDomain(domainId)

    const alias = data.alias.toLowerCase().trim()

    const mailAccount = await this.mailAccountRepository.findById(data.mailAccountId)
    if (!mailAccount || mailAccount.domainId !== domainId) {
      throw httpError(404, 'Mail account not found on this domain')
    }

    const existing = await this.repository.findByDomainIdAndAlias(domainId, alias)
    if (existing) throw httpError(409, `The alias "${alias}" already exists on this domain`)

    return this.repository.create({ domainId, alias, mailAccountId: data.mailAccountId })
  }

  async delete(id: number): Promise<void> {
    const roleAlias = await this.repository.findById(id)
    if (!roleAlias) throw httpError(404, 'Role alias not found')
    await this.assertOwnedDomain(roleAlias.domainId)
    await this.repository.delete(roleAlias)
  }

  private async assertOwnedDomain(domainId: number): Promise<void> {
    const domain = await this.domainService.findDomainById(domainId)
    if (!domain) throw httpError(404, 'Domain not found')
  }
}
