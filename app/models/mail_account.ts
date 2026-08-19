import { MailAccountSchema } from '#database/schema'
import { belongsTo, column, hasOne } from '@adonisjs/lucid/orm'
import { type BelongsTo, type HasOne } from '@adonisjs/lucid/types/relations'
import Domain from './domain.ts'
import MailAccountProfile from './mail_account_profile.ts'
import Signature from './signature.ts'
import User from './user.ts'

const prepareJsonColumn = (value: unknown) =>
  value === null || value === undefined ? value : JSON.stringify(value)

export default class MailAccount extends MailAccountSchema {
  @column({ prepare: prepareJsonColumn, serializeAs: null })
  declare twoFactorBackupCodes: any | null

  @belongsTo(() => User)
  declare user: BelongsTo<typeof User>

  @belongsTo(() => Domain)
  declare domain: BelongsTo<typeof Domain>

  @hasOne(() => MailAccountProfile)
  declare profile?: HasOne<typeof MailAccountProfile>

  @hasOne(() => Signature)
  declare signature?: HasOne<typeof Signature>
}
