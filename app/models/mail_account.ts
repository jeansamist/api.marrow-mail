import { MailAccountSchema } from '#database/schema'
import { belongsTo, hasOne } from '@adonisjs/lucid/orm'
import { type BelongsTo, type HasOne } from '@adonisjs/lucid/types/relations'
import Domain from './domain.ts'
import MailAccountProfile from './mail_account_profile.ts'
import User from './user.ts'

export default class MailAccount extends MailAccountSchema {
  @belongsTo(() => User)
  declare user: BelongsTo<typeof User>

  @belongsTo(() => Domain)
  declare domain: BelongsTo<typeof Domain>

  @hasOne(() => MailAccountProfile)
  declare profile?: HasOne<typeof MailAccountProfile>
}
