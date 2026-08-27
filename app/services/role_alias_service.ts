import MailAccountRepository from '#repositories/mail_account_repository'
import RoleAliasRepository from '#repositories/role_alias_repository'
import { DomainService } from '#services/domain_service'
import { httpError } from '#utils/http_error'
import { inject } from '@adonisjs/core'
import { Logger } from '@adonisjs/core/logger'

interface CreateRoleAliasPayload {
  alias: string
  mailAccountId: number
}

@inject()
export class RoleAliasService {
  constructor(
    private readonly repository: RoleAliasRepository,
    private readonly mailAccountRepository: MailAccountRepository,
    private readonly domainService: DomainService,
    private readonly logger: Logger
  ) {}

  async listForDomain(domainId: number) {
    this.logger.info(`List role aliases for domain: ${domainId}`)
    await this.assertOwnedDomain(domainId)
    return this.repository.findByDomainId(domainId)
  }

  async create(domainId: number, data: CreateRoleAliasPayload) {
    await this.assertOwnedDomain(domainId)

    const alias = data.alias.toLowerCase().trim()
    this.logger.info(
      `Create role alias: ${alias} for domain: ${domainId} mail account: ${data.mailAccountId}`
    )

    const mailAccount = await this.mailAccountRepository.findById(data.mailAccountId)
    if (!mailAccount || mailAccount.domainId !== domainId) {
      this.logger.warn(
        `Create role alias rejected for domain: ${domainId}: mail account: ${data.mailAccountId} ${mailAccount ? 'belongs to another domain' : 'not found'}`
      )
      throw httpError(404, 'Mail account not found on this domain')
    }

    const existing = await this.repository.findByDomainIdAndAlias(domainId, alias)
    if (existing) {
      this.logger.warn(
        `Create role alias rejected for domain: ${domainId}: alias already used by role alias: ${existing.id} alias: ${alias}`
      )
      throw httpError(409, `The alias "${alias}" already exists on this domain`)
    }

    return this.repository.create({ domainId, alias, mailAccountId: data.mailAccountId })
  }

  async delete(id: number): Promise<void> {
    const roleAlias = await this.repository.findById(id)
    if (!roleAlias) {
      this.logger.warn(`Role alias not found: ${id}`)
      throw httpError(404, 'Role alias not found')
    }
    this.logger.info(
      `Delete role alias: ${roleAlias.id} alias: ${roleAlias.alias} for domain: ${roleAlias.domainId}`
    )
    await this.assertOwnedDomain(roleAlias.domainId)
    await this.repository.delete(roleAlias)
  }

  private async assertOwnedDomain(domainId: number): Promise<void> {
    const domain = await this.domainService.findDomainById(domainId)
    if (!domain) {
      this.logger.warn(`Domain not found: ${domainId}`)
      throw httpError(404, 'Domain not found')
    }
  }
}
