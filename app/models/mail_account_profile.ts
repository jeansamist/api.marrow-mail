import { MailAccountProfileSchema } from '#database/schema'
import { belongsTo } from '@adonisjs/lucid/orm'
import { type BelongsTo } from '@adonisjs/lucid/types/relations'
import MailAccount from './mail_account.ts'

export default class MailAccountProfile extends MailAccountProfileSchema {
  @belongsTo(() => MailAccount)
  declare mailAccount: BelongsTo<typeof MailAccount>
}
