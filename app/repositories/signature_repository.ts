import { type SignatureSchema } from '#database/schema'
import Signature from '#models/signature'
import { type ModelProps } from '#utils/generics'

export default class SignatureRepository {
  private model = Signature

  async create(data: ModelProps<SignatureSchema>): Promise<Signature> {
    return this.model.create(data)
  }

  async findByMailAccountId(mailAccountId: number): Promise<Signature | null> {
    return this.model.query().where('mail_account_id', mailAccountId).first()
  }

  async update(
    signature: Signature,
    data: Partial<ModelProps<SignatureSchema>>
  ): Promise<Signature> {
    return signature.merge(data).save()
  }

  async delete(signature: Signature): Promise<void> {
    await signature.delete()
  }
}
