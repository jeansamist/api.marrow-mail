import FileRepository from '#repositories/file_repository'
import MailAccountRepository from '#repositories/mail_account_repository'
import MailRepository from '#repositories/mail_repository'
import { S3Service } from '#services/s3_service'
import { inject } from '@adonisjs/core'
import { Logger } from '@adonisjs/core/logger'
import { simpleParser } from 'mailparser'

interface SesReceiptNotification {
  notificationType: 'Received'
  mail: {
    timestamp: string
    source: string
    messageId: string
    destination: string[]
  }
  receipt: {
    timestamp: string
    recipients: string[]
    action: {
      type: 'S3'
      topicArn?: string
      bucketName: string
      objectKey: string
    }
  }
}

@inject()
export class EmailReceivingService {
  constructor(
    private readonly mailRepository: MailRepository,
    private readonly mailAccountRepository: MailAccountRepository,
    private readonly fileRepository: FileRepository,
    private readonly s3Service: S3Service,
    private readonly logger: Logger
  ) {}

  async processIncomingEmail(notification: SesReceiptNotification) {
    const { mail, receipt } = notification
    const { bucketName, objectKey } = receipt.action

    this.logger.info(`Processing incoming email ${mail.messageId}`)

    const rawEmailBuffer = await this.s3Service.getObjectBuffer(bucketName, objectKey)
    const parsed = await simpleParser(rawEmailBuffer)

    for (const recipientEmail of receipt.recipients) {
      const atIndex = recipientEmail.lastIndexOf('@')
      if (atIndex === -1) continue

      const username = recipientEmail.substring(0, atIndex)
      const domainName = recipientEmail.substring(atIndex + 1)

      const mailAccount = await this.mailAccountRepository.findByUsernameAndDomain(
        username,
        domainName
      )
      if (!mailAccount) {
        this.logger.warn(`No mail account found for ${recipientEmail}`)
        continue
      }

      const attachmentIds: number[] = []
      for (const attachment of parsed.attachments) {
        const filename = attachment.filename ?? `attachment-${Date.now()}`
        const s3Key = `received/${mail.messageId}/attachments/${filename}`

        await this.s3Service.putObject(bucketName, s3Key, attachment.content, attachment.contentType)

        const file = await this.fileRepository.create({
          key: s3Key,
          bucket: bucketName,
          originalName: filename,
          mimeType: attachment.contentType ?? null,
          size: attachment.size ?? attachment.content.length,
          mailAccountId: mailAccount.id,
        })
        attachmentIds.push(file.id)
      }

      const toAddresses = parsed.to
        ? (Array.isArray(parsed.to) ? parsed.to : [parsed.to]).flatMap((addr) =>
            addr.value.map((v) => v.address).filter((a): a is string => !!a)
          )
        : [recipientEmail]

      const ccAddresses = parsed.cc
        ? (Array.isArray(parsed.cc) ? parsed.cc : [parsed.cc]).flatMap((addr) =>
            addr.value.map((v) => v.address).filter((a): a is string => !!a)
          )
        : null

      await this.mailRepository.create({
        mailAccountId: mailAccount.id,
        fromEmail: parsed.from?.text ?? mail.source,
        toAddresses: toAddresses.length > 0 ? toAddresses : [recipientEmail],
        ccAddresses: ccAddresses && ccAddresses.length > 0 ? ccAddresses : null,
        bccAddresses: null,
        replyTo: parsed.replyTo?.text ?? null,
        subject: parsed.subject ?? '(no subject)',
        bodyHtml: typeof parsed.html === 'string' ? parsed.html : null,
        bodyText: parsed.text ?? null,
        status: 'received',
        direction: 'received',
        sesMessageId: mail.messageId,
        attachmentIds: attachmentIds.length > 0 ? attachmentIds : null,
      })

      this.logger.info(
        `Mail record created for ${recipientEmail} — ${attachmentIds.length} attachment(s)`
      )
    }
  }
}
