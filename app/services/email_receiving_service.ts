import type MailAccount from '#models/mail_account'
import FileRepository from '#repositories/file_repository'
import MailAccountRepository from '#repositories/mail_account_repository'
import MailRepository from '#repositories/mail_repository'
import RoleAliasRepository from '#repositories/role_alias_repository'
import { S3Service } from '#services/s3_service'
import { SESService } from '#services/ses_service'
import env from '#start/env'
import { inject } from '@adonisjs/core'
import { Logger } from '@adonisjs/core/logger'
import { simpleParser, type ParsedMail } from 'mailparser'
import CronManager from '../managers/crons_manager.js'

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
    private readonly roleAliasRepository: RoleAliasRepository,
    private readonly fileRepository: FileRepository,
    private readonly s3Service: S3Service,
    private readonly sesService: SESService,
    private readonly logger: Logger,
    private readonly cronManager: CronManager
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

      let mailAccount = await this.mailAccountRepository.findByUsernameAndDomain(
        username,
        domainName
      )
      if (!mailAccount) {
        const roleAlias = await this.roleAliasRepository.findByDomainNameAndAlias(
          domainName,
          username
        )
        if (roleAlias) {
          mailAccount = await this.mailAccountRepository.findById(roleAlias.mailAccountId)
        }
      }
      if (!mailAccount) {
        this.logger.warn(`No mail account found for ${recipientEmail}`)
        continue
      }

      const isForwarding = Boolean(mailAccount.forwardingEmail && mailAccount.forwardingVerified)
      if (isForwarding) {
        this.queueForward(mailAccount, parsed)
      }
      if (isForwarding && !mailAccount.keepForwardedCopy) {
        this.logger.info(
          `Forwarded ${recipientEmail} to ${mailAccount.forwardingEmail} without keeping a copy`
        )
        continue
      }

      const attachmentIds: number[] = []
      // Maps a MIME Content-ID (mailparser's `cid`) to the file's own
      // serving URL, so `cid:` references inside the stored HTML — inline
      // images and signature logos — resolve to something the app can
      // actually fetch, instead of a dead scheme the browser can't load.
      const cidToUrl = new Map<string, string>()
      for (const attachment of parsed.attachments) {
        const filename = attachment.filename ?? `attachment-${Date.now()}`
        const s3Key = `received/${mail.messageId}/attachments/${filename}`

        await this.s3Service.putObject(
          bucketName,
          s3Key,
          attachment.content,
          attachment.contentType
        )

        const file = await this.fileRepository.create({
          key: s3Key,
          bucket: bucketName,
          originalName: filename,
          mimeType: attachment.contentType ?? null,
          size: attachment.size ?? attachment.content.length,
          mailAccountId: mailAccount.id,
          kind: 'file',
          publicToken: null,
        })
        attachmentIds.push(file.id)
        if (attachment.cid) {
          cidToUrl.set(attachment.cid, `${env.get('APP_URL')}/api/mail/storage/files/${file.key}`)
        }
      }

      const bodyHtml =
        typeof parsed.html === 'string' ? this.rewriteCidReferences(parsed.html, cidToUrl) : null

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
        bodyHtml,
        bodyText: parsed.text ?? null,
        status: 'received',
        direction: 'received',
        sesMessageId: mail.messageId,
        attachmentIds: attachmentIds.length > 0 ? attachmentIds : null,
        important: false,
        isSpam: false,
        isRead: false,
        failureReason: null,
        deleted: false,
        folderId: null,
        scheduledAt: null,
      })

      this.logger.info(
        `Mail record created for ${recipientEmail} — ${attachmentIds.length} attachment(s)`
      )
    }
  }

  private rewriteCidReferences(html: string, cidToUrl: Map<string, string>): string {
    if (cidToUrl.size === 0) return html
    return html.replace(/cid:([^"'\s)]+)/g, (match, cid) => cidToUrl.get(cid) ?? match)
  }

  /**
   * Relays a received email's content — including attachments and inline
   * images — to the mailbox's verified forwarding address. Attachment bytes
   * come straight from the parsed MIME, not the uploaded File rows, since
   * this runs before (and independently of) the attachment-upload loop.
   */
  private queueForward(mailAccount: MailAccount, parsed: ParsedMail) {
    this.cronManager.addQueueJob(
      'mails',
      async () => {
        await mailAccount.load('domain')
        const originalFrom = parsed.from?.text ?? 'unknown sender'
        const forwardedHeaderText = [
          '---------- Forwarded message ----------',
          `From: ${originalFrom}`,
          parsed.subject ? `Subject: ${parsed.subject}` : null,
        ]
          .filter((line): line is string => !!line)
          .join('\n')

        await this.sesService.sendRichEmail({
          from: `${mailAccount.username}@${mailAccount.domain.name}`,
          to: [mailAccount.forwardingEmail!],
          replyTo: parsed.from?.value?.[0]?.address,
          subject: parsed.subject ? `Fwd: ${parsed.subject}` : 'Fwd: (no subject)',
          bodyText: [forwardedHeaderText, parsed.text]
            .filter((part): part is string => !!part)
            .join('\n\n'),
          bodyHtml: parsed.html
            ? `<p>${forwardedHeaderText.replace(/\n/g, '<br/>')}</p>${parsed.html}`
            : undefined,
          attachments: parsed.attachments.map((attachment) => ({
            filename: attachment.filename ?? `attachment-${Date.now()}`,
            contentType: attachment.contentType,
            content: attachment.content,
            disposition: attachment.contentDisposition === 'inline' ? 'INLINE' : 'ATTACHMENT',
            contentId: attachment.cid,
          })),
        })
        this.logger.info(`Forwarded mail to ${mailAccount.forwardingEmail}`)
      },
      {
        retries: 2,
        retryDelayMs: 2000,
        onRetriesExhausted: async () => {
          this.logger.error(`Failed to forward mail to ${mailAccount.forwardingEmail}`)
        },
      }
    )
  }
}
