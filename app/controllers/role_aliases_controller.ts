import { RoleAliasService } from '#services/role_alias_service'
import RoleAliasTransformer from '#transformers/role_alias_transformer'
import { ApiResponse } from '#utils/api_response'
import { createRoleAliasValidator } from '#validators/role_alias'
import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'

@inject()
export default class RoleAliasesController {
  constructor(private readonly roleAliasService: RoleAliasService) {}

  async index({ params, response, serialize }: HttpContext) {
    const roleAliases = await this.roleAliasService.listForDomain(Number(params.domainId))
    const serialized = await serialize(RoleAliasTransformer.transform(roleAliases))
    return response.ok(ApiResponse.success(serialized.data, 'Role aliases retrieved'))
  }

  async store({ params, request, response, serialize }: HttpContext) {
    const data = await request.validateUsing(createRoleAliasValidator)
    const roleAlias = await this.roleAliasService.create(Number(params.domainId), data)
    const serialized = await serialize(RoleAliasTransformer.transform(roleAlias))
    return response.created(ApiResponse.success(serialized.data, 'Role alias created'))
  }

  async destroy({ params, response }: HttpContext) {
    await this.roleAliasService.delete(Number(params.id))
    return response.ok(ApiResponse.success(null, 'Role alias deleted'))
  }
}
