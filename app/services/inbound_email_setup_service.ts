import env from '#start/env'
import { SesReceiptService } from '#services/ses_receipt_service'
import { SnsService } from '#services/sns_service'
import { S3Service } from '#services/s3_service'
import { inject } from '@adonisjs/core'
import { Logger } from '@adonisjs/core/logger'

@inject()
export class InboundEmailSetupService {
  constructor(
    private readonly sesReceiptService: SesReceiptService,
    private readonly snsService: SnsService,
    private readonly s3Service: S3Service,
    private readonly logger: Logger
  ) {}

  async setupDomainReceiving(domainName: string) {
    const bucketName = env.get('AWS_BUCKET')
    const ruleSetName = env.get('AWS_SES_RULE_SET_NAME')
    const webhookUrl = `${env.get('APP_URL')}/api/webhooks/ses`

    this.logger.info(`[InboundEmailSetupService] Setting up inbound receiving for ${domainName}`)

    // CreateTopicCommand is idempotent — same name returns same ARN
    const topicArn = await this.snsService.ensureTopic('marrow-mail-inbound')

    // Subscribe our webhook (SNS deduplicates by endpoint+protocol)
    await this.snsService.subscribeHttpEndpoint(topicArn, webhookUrl)

    // Merge SES write permission into the existing bucket policy
    await this.s3Service.configureSESBucketPolicy(bucketName)

    // Create rule set and activate it (idempotent)
    await this.sesReceiptService.ensureRuleSet(ruleSetName)
    await this.sesReceiptService.activateRuleSet(ruleSetName)

    // Add receipt rule for this domain (idempotent)
    await this.sesReceiptService.createDomainReceiptRule({
      ruleSetName,
      domainName,
      bucketName,
      s3KeyPrefix: 'received/',
      snsTopicArn: topicArn,
    })

    this.logger.info(`[InboundEmailSetupService] Setup complete for ${domainName}`)
  }

  async teardownDomainReceiving(domainName: string) {
    const ruleSetName = env.get('AWS_SES_RULE_SET_NAME')
    await this.sesReceiptService.deleteDomainReceiptRule(ruleSetName, domainName)
    this.logger.info(`[InboundEmailSetupService] Receipt rule removed for ${domainName}`)
  }
}
