import { FileSchema } from '#database/schema'
import { belongsTo } from '@adonisjs/lucid/orm'
import { type BelongsTo } from '@adonisjs/lucid/types/relations'
import MailAccount from './mail_account.ts'

export default class File extends FileSchema {
  @belongsTo(() => MailAccount)
  declare mailAccount: BelongsTo<typeof MailAccount>
}
