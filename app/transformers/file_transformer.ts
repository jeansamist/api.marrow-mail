import env from '#start/env'
import type File from '#models/file'
import { BaseTransformer } from '@adonisjs/core/transformers'

export default class FileTransformer extends BaseTransformer<File> {
  toObject() {
    return {
      ...this.pick(this.resource, [
        'id',
        'key',
        'originalName',
        'mimeType',
        'size',
        'mailAccountId',
        'createdAt',
      ]),
      publicUrl: `${env.get('APP_URL')}/api/mail/storage/files/${this.resource.key}`,
    }
  }
}
