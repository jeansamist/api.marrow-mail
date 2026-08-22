import type File from '#models/file'
import FileRepository from '#repositories/file_repository'
import { S3Service } from '#services/s3_service'
import env from '#start/env'
import { buildVoiceNoteEmailBlock } from '#utils/voice_note_email'
import { inject } from '@adonisjs/core'
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
    private readonly s3Service: S3Service
  ) {}

  async resolve(
    attachmentIds: number[] | undefined
  ): Promise<{ attachments: OutgoingAttachment[]; voiceNoteHtml: string }> {
    if (!attachmentIds || attachmentIds.length === 0) return { attachments: [], voiceNoteHtml: '' }

    const files = await Promise.all(attachmentIds.map((id) => this.fileRepository.findById(id)))

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

    return { attachments, voiceNoteHtml: voiceNoteBlocks.join('') }
  }

  private async buildVoiceNoteHtml(file: File): Promise<string> {
    let token = file.publicToken
    if (!token) {
      token = randomBytes(24).toString('hex')
      await this.fileRepository.update(file, { publicToken: token })
    }
    return buildVoiceNoteEmailBlock(`${env.get('FRONTEND_APP_URL')}/voice/${token}`)
  }
}
