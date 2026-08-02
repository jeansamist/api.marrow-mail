import { SignatureSchema } from '#database/schema'
import { belongsTo } from '@adonisjs/lucid/orm'
import { type BelongsTo } from '@adonisjs/lucid/types/relations'
import MailAccount from './mail_account.ts'

export default class Signature extends SignatureSchema {
  @belongsTo(() => MailAccount)
  declare mailAccount: BelongsTo<typeof MailAccount>
}
