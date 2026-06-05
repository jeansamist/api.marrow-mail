import env from '#start/env'
import { inject } from '@adonisjs/core'
import { Logger } from '@adonisjs/core/logger'
import {
  CreateEmailIdentityCommand,
  DeleteEmailIdentityCommand,
  GetEmailIdentityCommand,
  PutEmailIdentityMailFromAttributesCommand,
  SendEmailCommand,
  SESv2Client,
} from '@aws-sdk/client-sesv2'

interface DNSRecord {
  Name: string
  Type: string
  Value: string
  Priority?: number // for MX records
}

@inject()
export class SESService {
  client = new SESv2Client({
    region: env.get('AWS_REGION'),
    credentials: {
      accessKeyId: env.get('AWS_ACCESS_KEY_ID'),
      secretAccessKey: env.get('AWS_SECRET_ACCESS_KEY'),
    },
  })
  constructor(private readonly logger: Logger) {}
  async createEmailIdentity(domainName: string) {
    const emailIdentity = await this.client
      .send(
        new CreateEmailIdentityCommand({
          EmailIdentity: domainName,
        })
      )
      .then((response) => {
        this.logger.info(`Email identity created successfully for domain ${domainName}`)
        return response
      })
      .catch((error) => {
        this.logger.error(
          `Failed to create email identity for domain ${domainName}: ${error.message}`
        )
        throw error
      })
    return emailIdentity
  }

  async getEmailIdentity(domainName: string) {
    const emailIdentity = await this.client
      .send(
        new GetEmailIdentityCommand({
          EmailIdentity: domainName,
        })
      )
      .then((response) => {
        this.logger.info(`Email identity retrieved successfully for domain ${domainName}`)
        return response
      })
      .catch((error) => {
        this.logger.error(
          `Failed to retrieve email identity for domain ${domainName}: ${error.message}`
        )
        throw error
      })
    return emailIdentity
  }
  async getAllRecordsForEmailIdentity(domainName: string): Promise<DNSRecord[]> {
    const dkimRecords = await this.getDKIMRecordsForEmailIdentity(domainName)
    const mailFromRecords = this.getMailFromDNS(domainName)

    return [...dkimRecords, ...mailFromRecords]
  }
  async putEmailIdentityMailFromAttributes(domainName: string) {
    const emailIdentity = await this.client
      .send(
        new PutEmailIdentityMailFromAttributesCommand({
          EmailIdentity: domainName,
          MailFromDomain: `mail.${domainName}`,
          // BehaviorOnMXFailure: 'USE_DEFAULT_VALUE',
          BehaviorOnMxFailure: 'USE_DEFAULT_VALUE',
        })
      )
      .then((response) => {
        this.logger.info(`Mail from attributes set successfully for domain ${domainName}`)
        return response
      })
      .catch((error) => {
        this.logger.error(
          `Failed to set mail from attributes for domain ${domainName}: ${error.message}`
        )
        throw error
      })
    return emailIdentity
  }
  async deleteEmailIdentity(domainName: string) {
    const emailIdentity = await this.client
      .send(
        new DeleteEmailIdentityCommand({
          EmailIdentity: domainName,
        })
      )
      .then((response) => {
        this.logger.info(`Email identity deleted successfully for domain ${domainName}`)
        return response
      })
      .catch((error) => {
        this.logger.error(
          `Failed to delete email identity for domain ${domainName}: ${error.message}`
        )
        throw error
      })
    return emailIdentity
  }
  formatDNSRecordsForTheConsole(records: DNSRecord[]) {
    return records.map((record) => {
      if (record.Type === 'MX') {
        return `${record.Name} ${record.Type} ${record.Value} Priority: ${record.Priority}`
      }
      return `${record.Name} ${record.Type} ${record.Value}`
    })
  }
  async verifyEmailIdentity(
    domainName: string,
    maxAttempts = 20,
    delayMs = 15000
  ): Promise<boolean> {
    let attempts = 0

    while (attempts < maxAttempts) {
      const identity = await this.getEmailIdentity(domainName)

      const verified = identity?.VerifiedForSendingStatus
      const dkimStatus = identity?.DkimAttributes?.Status

      this.logger.info(`Check ${attempts + 1}: verified=${verified}, dkim=${dkimStatus}`)

      if (verified === true && dkimStatus === 'SUCCESS') {
        this.logger.info(`Domain ${domainName} fully verified and DKIM setup successful`)
        return true
      }

      await new Promise((r) => setTimeout(r, delayMs))
      attempts++
    }

    throw new Error(`Domain ${domainName} not verified after timeout`)
  }
  async checkEmailIdentity(domainName: string): Promise<boolean> {
    const identity = await this.getEmailIdentity(domainName)
    const verified = identity?.VerifiedForSendingStatus
    const dkimStatus = identity?.DkimAttributes?.Status
    this.logger.info(`Check : verified=${verified}, dkim=${dkimStatus}`)
    if (verified === true && dkimStatus === 'SUCCESS') {
      this.logger.info(`Domain ${domainName} fully verified and DKIM setup successful`)
      return true
    } else {
      return false
    }
  }
  getMailFromDNS(domainName: string): DNSRecord[] {
    const sub = `mail.${domainName}`

    return [
      {
        Name: sub,
        Type: 'MX',
        Value: `feedback-smtp.${env.get('AWS_REGION')}.amazonses.com`,
        Priority: 10,
      },
      {
        Name: sub,
        Type: 'TXT',
        Value: `v=spf1 include:amazonses.com ~all`,
      },
    ]
  }
  async sendEmailUsing(
    domainName: string,
    config: { to: string; subject: string; text: string; from?: string }
  ) {
    const output = await this.client
      .send(
        new SendEmailCommand({
          FromEmailAddress: config.from || `test@${domainName}`,
          Destination: {
            ToAddresses: [config.to],
          },
          Content: {
            Simple: {
              Subject: {
                Data: config.subject,
              },
              Body: {
                Text: {
                  Data: config.text,
                },
              },
            },
          },
        })
      )
      .then((response) => {
        this.logger.info(
          `Email sent successfully to ${config.to}. Message ID: ${response.MessageId}`
        )
        return response
      })
      .catch((error) => {
        this.logger.error(`Failed to send email to ${config.to}: ${error.message}`)
        throw error
      })
    return output
  }
  async getDKIMRecordsForEmailIdentity(domainName: string): Promise<DNSRecord[]> {
    // Your code here
    const emailIdentity = await this.getEmailIdentity(domainName)

    const tokens = emailIdentity?.DkimAttributes?.Tokens

    if (!tokens || tokens.length === 0) {
      this.logger.error(`No DKIM tokens found for ${domainName}`)
      throw new Error(`No DKIM tokens found for ${domainName}`)
    }

    return tokens.map((token) => ({
      Name: `${token}._domainkey.${domainName}`,
      Type: 'CNAME',
      Value: `${token}.dkim.amazonses.com`,
    }))
  }
}
