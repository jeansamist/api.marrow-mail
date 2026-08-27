import { type SignatureSchema } from '#database/schema'
import SignatureRepository from '#repositories/signature_repository'
import { AuthMailAccountService } from '#services/auth_mail_account_service'
import { type ModelProps } from '#utils/generics'
import { inject } from '@adonisjs/core'
import { Logger } from '@adonisjs/core/logger'

@inject()
export class SignatureService {
  constructor(
    private readonly signatureRepository: SignatureRepository,
    private readonly authMailAccountService: AuthMailAccountService,
    private readonly logger: Logger
  ) {}

  async getSignature() {
    const mailAccount = await this.authMailAccountService.getRequestMailAccount()
    this.logger.info(`Get signature for mail account: ${mailAccount.id}`)
    return this.signatureRepository.findByMailAccountId(mailAccount.id)
  }

  async upsertSignature(data: Partial<ModelProps<SignatureSchema>>) {
    const mailAccount = await this.authMailAccountService.getRequestMailAccount()
    this.logger.info(
      `Upsert signature for mail account: ${mailAccount.id} fields: ${Object.keys(data).join(', ')}`
    )
    const existing = await this.signatureRepository.findByMailAccountId(mailAccount.id)

    if (existing) {
      this.logger.info(`Update signature: ${existing.id} for mail account: ${mailAccount.id}`)
      return this.signatureRepository.update(existing, data)
    }

    this.logger.info(`Create signature for mail account: ${mailAccount.id}`)
    return this.signatureRepository.create({
      includePhoto: false,
      includeInNewEmails: true,
      includeInReplies: true,
      ...data,
      mailAccountId: mailAccount.id,
    } as ModelProps<SignatureSchema>)
  }
}
