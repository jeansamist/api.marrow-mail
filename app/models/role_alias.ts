import { RoleAliasSchema } from '#database/schema'
import { belongsTo } from '@adonisjs/lucid/orm'
import { type BelongsTo } from '@adonisjs/lucid/types/relations'
import Domain from './domain.ts'
import MailAccount from './mail_account.ts'

export default class RoleAlias extends RoleAliasSchema {
  @belongsTo(() => Domain)
  declare domain: BelongsTo<typeof Domain>

  @belongsTo(() => MailAccount)
  declare mailAccount: BelongsTo<typeof MailAccount>
}
