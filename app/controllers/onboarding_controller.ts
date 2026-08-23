import type { HttpContext } from '@adonisjs/core/http'

import { DomainService } from '#services/domain_service'
import { MailAccountService } from '#services/mail_account_service'
import { RecordService } from '#services/record_service'
import { SubscriptionService } from '#services/subscription_service'
import DomainTransformer from '#transformers/domain_transformer'
import MailAccountTransformer from '#transformers/mail_account_transformer'
import RecordTransformer from '#transformers/record_transformer'
import { ApiResponse } from '#utils/api_response'
import { createDomainValidator } from '#validators/domain'
import { createManyMailAccountsValidator } from '#validators/mail_account'
import { inject } from '@adonisjs/core'

@inject()
export default class OnboardingController {
  constructor(
    protected readonly domainService: DomainService,
    protected readonly recordService: RecordService,
    protected readonly mailAccountService: MailAccountService,
    protected readonly subscriptionService: SubscriptionService
  ) {}
  async registerDomain({ request, response, serialize }: HttpContext) {
    const data = await request.validateUsing(createDomainValidator)
    const records = await this.domainService.setupDomain(data)
    const serialized = await serialize(RecordTransformer.transform(records))
    return await response.ok(ApiResponse.success(serialized.data, 'Domain created'))
  }
  async getDNSRecords({ request, response, serialize }: HttpContext) {
    const domainName = request.input('domainName')
    const domain = await this.domainService.findDomainByNameOrFail(domainName)
    const records = await this.recordService.findRecordsByDomainId(domain.id)
    const serialized = await serialize(RecordTransformer.transform(records))
    return await response.ok(ApiResponse.success(serialized.data, 'DNS Records'))
  }

  async checkDomainStatus({ request, response, serialize }: HttpContext) {
    const domainName = request.input('domainName')
    const verified = await this.domainService.checkDomainStatusByName(domainName)
    const domain = await this.domainService.findDomainByNameOrFail(domainName)
    const serialized = await serialize(DomainTransformer.transform(domain))
    return await response.ok(
      ApiResponse.success(
        { verified, mailFromVerified: serialized.data.mailFromVerified },
        'Domain status'
      )
    )
  }

  async setupMailAccount({ request, response, serialize }: HttpContext) {
    const { data } = await request.validateUsing(createManyMailAccountsValidator)
    const domainName = request.input('domainName')
    const domain = await this.domainService.findDomainByNameOrFail(domainName)
    const existingMailboxCount = await this.mailAccountService.countForCurrentUser()
    await this.subscriptionService.assertActiveEntitlement(existingMailboxCount + data.length)
    const mailAccounts = await this.mailAccountService.setupEmailAddress({
      data,
      domainId: domain.id,
    })
    const serialized = await serialize(MailAccountTransformer.transform(mailAccounts))
    return await response.ok(ApiResponse.success(serialized.data, 'Accounts'))
  }
}
