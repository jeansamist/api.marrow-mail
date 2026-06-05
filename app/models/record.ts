import { RecordSchema } from '#database/schema'
import { belongsTo } from '@adonisjs/lucid/orm'
import { type BelongsTo } from '@adonisjs/lucid/types/relations'
import Domain from './domain.ts'
import User from './user.ts'

export default class Record extends RecordSchema {
  @belongsTo(() => User)
  declare user: BelongsTo<typeof User>

  @belongsTo(() => Domain)
  declare domain: BelongsTo<typeof Domain>
}
