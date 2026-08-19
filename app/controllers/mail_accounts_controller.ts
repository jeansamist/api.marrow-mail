import { MailAccountService } from '#services/mail_account_service'
import { StorageOverviewService } from '#services/storage_overview_service'
import MailAccountTransformer from '#transformers/mail_account_transformer'
import { ApiResponse } from '#utils/api_response'
import { updateStorageQuotaValidator } from '#validators/storage'
import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'

@inject()
export default class MailAccountsController {
  constructor(
    private readonly mailAccountService: MailAccountService,
    private readonly storageOverviewService: StorageOverviewService
  ) {}

  async index({ response, serialize }: HttpContext) {
    const mailAccounts = await this.mailAccountService.listMailAccountsForCurrentUser()
    const serialized = await serialize(MailAccountTransformer.transform(mailAccounts))
    return response.ok(ApiResponse.success(serialized.data, 'Mail accounts retrieved'))
  }

  async destroy({ params, response }: HttpContext) {
    await this.mailAccountService.deleteMailAccount(Number(params.id))
    return response.ok(ApiResponse.success(null, 'Mail account deleted'))
  }

  async updateStorageQuota({ params, request, response }: HttpContext) {
    const data = await request.validateUsing(updateStorageQuotaValidator)
    await this.storageOverviewService.updateQuota(Number(params.id), data.quotaBytes)
    return response.ok(ApiResponse.success(null, 'Storage quota updated'))
  }

  async toggleActive({ params, response, serialize }: HttpContext) {
    const mailAccount = await this.mailAccountService.toggleActive(Number(params.id))
    const serialized = await serialize(MailAccountTransformer.transform(mailAccount))
    return response.ok(ApiResponse.success(serialized.data, 'Mail account updated'))
  }

  async resendInvite({ params, response }: HttpContext) {
    await this.mailAccountService.resendInvite(Number(params.id))
    return response.ok(ApiResponse.success(null, 'Invite resent'))
  }
}
