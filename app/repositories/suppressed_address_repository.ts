import SuppressedAddress from '#models/suppressed_address'
import { type ModelProps } from '#utils/generics'

export default class SuppressedAddressRepository {
  private model = SuppressedAddress
  get getModel(): typeof SuppressedAddress {
    return this.model
  }

  async findByEmail(email: string): Promise<SuppressedAddress | null> {
    return this.model.query().where('email', email).first()
  }

  async create(data: ModelProps<SuppressedAddress>): Promise<SuppressedAddress> {
    return this.model.create(data)
  }

  async update(
    suppressedAddress: SuppressedAddress,
    data: Partial<ModelProps<SuppressedAddress>>
  ): Promise<SuppressedAddress> {
    return suppressedAddress.merge(data).save()
  }
}
