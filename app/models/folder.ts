import { FolderSchema } from '#database/schema'
import { belongsTo, hasMany } from '@adonisjs/lucid/orm'
import { type BelongsTo, type HasMany } from '@adonisjs/lucid/types/relations'
import Mail from './mail.ts'
import MailAccount from './mail_account.ts'

export default class Folder extends FolderSchema {
  @belongsTo(() => MailAccount)
  declare mailAccount: BelongsTo<typeof MailAccount>

  @hasMany(() => Mail)
  declare mails: HasMany<typeof Mail>
}
