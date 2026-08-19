import FileRepository from '#repositories/file_repository'
import MailAccountRepository from '#repositories/mail_account_repository'
import { DEFAULT_MAILBOX_STORAGE_BYTES } from '#utils/pricing'
import { httpError } from '#utils/http_error'
import { inject } from '@adonisjs/core'
import { HttpContext } from '@adonisjs/core/http'

@inject()
export class StorageOverviewService {
  constructor(
    private readonly fileRepository: FileRepository,
    private readonly mailAccountRepository: MailAccountRepository,
    private readonly ctx: HttpContext
  ) {}

  private get userId() {
    return this.ctx.auth.user!.id
  }

  async getUsageForCurrentUser() {
    const mailAccounts = await this.mailAccountRepository.findAllByUserId(this.userId)
    const usageByAccount = await this.fileRepository.sumSizeByMailAccountIds(
      mailAccounts.map((account) => account.id)
    )

    const mailboxes = mailAccounts.map((account) => {
      const usedBytes = usageByAccount.get(account.id) ?? 0
      const quotaBytes = Number(account.storageQuotaBytes ?? DEFAULT_MAILBOX_STORAGE_BYTES)
      return {
        mailAccountId: account.id,
        username: account.username,
        usedBytes,
        quotaBytes,
      }
    })

    return {
      mailboxes,
      totalUsedBytes: mailboxes.reduce((sum, mailbox) => sum + mailbox.usedBytes, 0),
      totalQuotaBytes: mailboxes.reduce((sum, mailbox) => sum + mailbox.quotaBytes, 0),
    }
  }

  async updateQuota(mailAccountId: number, quotaBytes: number) {
    const mailAccount = await this.mailAccountRepository.findById(mailAccountId)
    if (!mailAccount) throw httpError(404, 'Mail account not found')
    if (mailAccount.userId !== this.userId) {
      throw httpError(403, 'You are not allowed to access this mail account')
    }
    return this.mailAccountRepository.update(mailAccount, { storageQuotaBytes: quotaBytes })
  }

  async assertWithinQuota(mailAccountId: number, additionalBytes: number): Promise<void> {
    const mailAccount = await this.mailAccountRepository.findById(mailAccountId)
    if (!mailAccount) throw httpError(404, 'Mail account not found')

    const usedBytes = await this.fileRepository.sumSizeByMailAccountId(mailAccountId)
    const quotaBytes = Number(mailAccount.storageQuotaBytes ?? DEFAULT_MAILBOX_STORAGE_BYTES)

    if (usedBytes + additionalBytes > quotaBytes) {
      throw httpError(413, 'Storage quota exceeded')
    }
  }
}
