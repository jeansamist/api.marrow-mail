import type RoleAlias from '#models/role_alias'
import { BaseTransformer } from '@adonisjs/core/transformers'

export default class RoleAliasTransformer extends BaseTransformer<RoleAlias> {
  toObject() {
    return this.pick(this.resource, [
      'id',
      'domainId',
      'alias',
      'mailAccountId',
      'createdAt',
      'updatedAt',
    ])
  }
}
