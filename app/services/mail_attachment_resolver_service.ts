import type File from '#models/file'
import FileRepository from '#repositories/file_repository'
import { S3Service } from '#services/s3_service'
import env from '#start/env'
import { buildVoiceNoteEmailBlock } from '#utils/voice_note_email'
import { inject } from '@adonisjs/core'
import { Logger } from '@adonisjs/core/logger'
import { randomBytes } from 'node:crypto'

export interface OutgoingAttachment {
  filename: string
  contentType: string
  content: Uint8Array
  disposition?: 'ATTACHMENT' | 'INLINE'
}

/**
 * Splits a mail's attachmentIds into real SES attachments and voice notes.
 * A voice note is never sent as a raw file — it's rendered as a play-button
 * block appended to the HTML body, linking out to its public playback page.
 * Shared between MailService (interactive sends) and
 * ScheduledMailDispatchService (cron-driven sends) so both stay in sync.
 */
@inject()
export class MailAttachmentResolverService {
  constructor(
    private readonly fileRepository: FileRepository,
    private readonly s3Service: S3Service,
    private readonly logger: Logger
  ) {}

  async resolve(
    attachmentIds: number[] | undefined
  ): Promise<{ attachments: OutgoingAttachment[]; voiceNoteHtml: string }> {
    if (!attachmentIds || attachmentIds.length === 0) return { attachments: [], voiceNoteHtml: '' }

    this.logger.info(
      `Resolve attachments: ${attachmentIds.length} files: ${attachmentIds.join(', ')}`
    )
    const files = await Promise.all(attachmentIds.map((id) => this.fileRepository.findById(id)))
    const missingIds = attachmentIds.filter((_id, index) => !files[index])
    if (missingIds.length > 0) {
      this.logger.warn(`Skip missing attachment files: ${missingIds.join(', ')}`)
    }

    const attachments: OutgoingAttachment[] = []
    const voiceNoteBlocks: string[] = []

    for (const file of files) {
      if (!file) continue
      if (file.kind === 'voice_note') {
        voiceNoteBlocks.push(await this.buildVoiceNoteHtml(file))
        continue
      }
      const content = await this.s3Service.getObjectBuffer(file.bucket, file.key)
      attachments.push({
        filename: file.originalName,
        contentType: file.mimeType ?? 'application/octet-stream',
        content,
      })
    }

    this.logger.info(
      `Resolved attachments: ${attachments.length} total bytes: ${attachments.reduce((sum, attachment) => sum + attachment.content.byteLength, 0)} voice notes: ${voiceNoteBlocks.length}`
    )
    return { attachments, voiceNoteHtml: voiceNoteBlocks.join('') }
  }

  private async buildVoiceNoteHtml(file: File): Promise<string> {
    let token = file.publicToken
    if (!token) {
      this.logger.info(`Generate public token for voice note file: ${file.id}`)
      token = randomBytes(24).toString('hex')
      await this.fileRepository.update(file, { publicToken: token })
    }
    return buildVoiceNoteEmailBlock(`${env.get('FRONTEND_APP_URL')}/voice/${token}`)
  }
}
