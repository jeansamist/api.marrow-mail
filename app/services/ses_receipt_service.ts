import env from '#start/env'
import { inject } from '@adonisjs/core'
import { Logger } from '@adonisjs/core/logger'
import {
  AlreadyExistsException,
  CreateReceiptRuleCommand,
  CreateReceiptRuleSetCommand,
  DeleteReceiptRuleCommand,
  SESClient,
  SetActiveReceiptRuleSetCommand,
} from '@aws-sdk/client-ses'

@inject()
export class SesReceiptService {
  private client = new SESClient({
    region: env.get('AWS_REGION'),
    credentials: {
      accessKeyId: env.get('AWS_ACCESS_KEY_ID'),
      secretAccessKey: env.get('AWS_SECRET_ACCESS_KEY'),
    },
  })

  constructor(private readonly logger: Logger) {}

  async ensureRuleSet(ruleSetName: string) {
    try {
      await this.client.send(new CreateReceiptRuleSetCommand({ RuleSetName: ruleSetName }))
      this.logger.info(`SES receipt rule set "${ruleSetName}" created`)
    } catch (error) {
      if (error instanceof AlreadyExistsException) {
        this.logger.info(`SES receipt rule set "${ruleSetName}" already exists`)
        return
      }
      throw error
    }
  }

  async activateRuleSet(ruleSetName: string) {
    await this.client.send(new SetActiveReceiptRuleSetCommand({ RuleSetName: ruleSetName }))
    this.logger.info(`SES receipt rule set "${ruleSetName}" activated`)
  }

  async createDomainReceiptRule(params: {
    ruleSetName: string
    domainName: string
    bucketName: string
    s3KeyPrefix: string
    snsTopicArn: string
  }) {
    const ruleName = `marrow-mail-${params.domainName.replace(/\./g, '-')}`

    try {
      await this.client.send(
        new CreateReceiptRuleCommand({
          RuleSetName: params.ruleSetName,
          Rule: {
            Name: ruleName,
            Enabled: true,
            ScanEnabled: true,
            Recipients: [params.domainName],
            Actions: [
              {
                S3Action: {
                  BucketName: params.bucketName,
                  ObjectKeyPrefix: params.s3KeyPrefix,
                  TopicArn: params.snsTopicArn,
                },
              },
            ],
          },
        })
      )
      this.logger.info(`SES receipt rule "${ruleName}" created for domain ${params.domainName}`)
    } catch (error) {
      if (error instanceof AlreadyExistsException) {
        this.logger.info(`SES receipt rule "${ruleName}" already exists`)
        return
      }
      throw error
    }
  }

  async deleteDomainReceiptRule(ruleSetName: string, domainName: string) {
    const ruleName = `marrow-mail-${domainName.replace(/\./g, '-')}`
    await this.client.send(
      new DeleteReceiptRuleCommand({ RuleSetName: ruleSetName, RuleName: ruleName })
    )
    this.logger.info(`SES receipt rule "${ruleName}" deleted`)
  }
}
