import { PaymentSchema } from '#database/schema'
import { belongsTo } from '@adonisjs/lucid/orm'
import { type BelongsTo } from '@adonisjs/lucid/types/relations'
import Subscription from './subscription.ts'

export default class Payment extends PaymentSchema {
  @belongsTo(() => Subscription)
  declare subscription: BelongsTo<typeof Subscription>
}
