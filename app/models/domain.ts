import { DomainSchema } from '#database/schema'
import { belongsTo, hasMany } from '@adonisjs/lucid/orm'
import { type BelongsTo, type HasMany } from '@adonisjs/lucid/types/relations'
import MailAccount from './mail_account.ts'
import Record from './record.ts'
import User from './user.ts'

export default class Domain extends DomainSchema {
  @hasMany(() => Record)
  declare records: HasMany<typeof Record>

  @belongsTo(() => User)
  declare user: BelongsTo<typeof User>

  @hasMany(() => MailAccount)
  declare mailAccounts: HasMany<typeof MailAccount>
}
