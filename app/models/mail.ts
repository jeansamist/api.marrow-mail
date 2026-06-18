import { MailSchema } from '#database/schema'
import { belongsTo, column } from '@adonisjs/lucid/orm'
import { type BelongsTo } from '@adonisjs/lucid/types/relations'
import MailAccount from './mail_account.ts'

const prepareJsonColumn = (value: unknown) =>
  value === null || value === undefined ? value : JSON.stringify(value)

export default class Mail extends MailSchema {
  static table = 'mails'

  @column({ prepare: prepareJsonColumn })
  declare attachmentIds: any | null

  @column({ prepare: prepareJsonColumn })
  declare bccAddresses: any | null

  @column({ prepare: prepareJsonColumn })
  declare ccAddresses: any | null

  @column({ prepare: prepareJsonColumn })
  declare toAddresses: any

  @belongsTo(() => MailAccount)
  declare mailAccount: BelongsTo<typeof MailAccount>
}
