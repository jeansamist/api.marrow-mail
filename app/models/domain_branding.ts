import { DomainBrandingSchema } from '#database/schema'
import { belongsTo } from '@adonisjs/lucid/orm'
import { type BelongsTo } from '@adonisjs/lucid/types/relations'
import Domain from './domain.ts'
import File from './file.ts'

export default class DomainBranding extends DomainBrandingSchema {
  @belongsTo(() => Domain)
  declare domain: BelongsTo<typeof Domain>

  @belongsTo(() => File, { foreignKey: 'logoFileId' })
  declare logoFile: BelongsTo<typeof File>
}
