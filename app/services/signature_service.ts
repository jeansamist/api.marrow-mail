import { type SignatureSchema } from '#database/schema'
import SignatureRepository from '#repositories/signature_repository'
import { AuthMailAccountService } from '#services/auth_mail_account_service'
import { type ModelProps } from '#utils/generics'
import { inject } from '@adonisjs/core'

@inject()
export class SignatureService {
  constructor(
    private readonly signatureRepository: SignatureRepository,
    private readonly authMailAccountService: AuthMailAccountService
  ) {}

  async getSignature() {
    const mailAccount = await this.authMailAccountService.getRequestMailAccount()
    return this.signatureRepository.findByMailAccountId(mailAccount.id)
  }

  async upsertSignature(data: Partial<ModelProps<SignatureSchema>>) {
    const mailAccount = await this.authMailAccountService.getRequestMailAccount()
    const existing = await this.signatureRepository.findByMailAccountId(mailAccount.id)

    if (existing) {
      return this.signatureRepository.update(existing, data)
    }

    return this.signatureRepository.create({
      includePhoto: false,
      includeInNewEmails: true,
      includeInReplies: true,
      ...data,
      mailAccountId: mailAccount.id,
    } as ModelProps<SignatureSchema>)
  }
}
