import { SignatureService } from '#services/signature_service'
import SignatureTransformer from '#transformers/signature_transformer'
import { ApiResponse } from '#utils/api_response'
import { signatureValidator } from '#validators/signature'
import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'

@inject()
export default class SignaturesController {
  constructor(private readonly signatureService: SignatureService) {}

  async show({ response, serialize }: HttpContext) {
    const signature = await this.signatureService.getSignature()
    if (!signature) {
      return response.ok(ApiResponse.success(null, 'Signature not set'))
    }
    const serialized = await serialize(SignatureTransformer.transform(signature))
    return response.ok(ApiResponse.success(serialized.data, 'Signature retrieved'))
  }

  async update({ request, response, serialize }: HttpContext) {
    const data = await request.validateUsing(signatureValidator)
    const signature = await this.signatureService.upsertSignature(data)
    const serialized = await serialize(SignatureTransformer.transform(signature))
    return response.ok(ApiResponse.success(serialized.data, 'Signature saved'))
  }
}
