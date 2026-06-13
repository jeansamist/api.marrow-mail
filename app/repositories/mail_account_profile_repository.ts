import { type MailAccountProfileSchema } from '#database/schema'
import MailAccountProfile from '#models/mail_account_profile'
import { type ModelProps } from '#utils/generics'

export default class MailAccountProfileRepository {
  private model = MailAccountProfile

  get getModel(): typeof MailAccountProfile {
    return this.model
  }

  async create(data: ModelProps<MailAccountProfileSchema>): Promise<MailAccountProfile> {
    const profile = new this.model()
    profile.fill(data)
    await profile.save()
    return profile
  }

  async findById(id: number): Promise<MailAccountProfile | null> {
    return this.model.find(id)
  }

  async findByMailAccountId(mailAccountId: number): Promise<MailAccountProfile | null> {
    return this.model.query().where('mail_account_id', mailAccountId).first()
  }

  async update(
    profile: MailAccountProfile,
    data: Partial<ModelProps<MailAccountProfileSchema>>
  ): Promise<MailAccountProfile> {
    return profile.merge(data).save()
  }

  async delete(profile: MailAccountProfile): Promise<void> {
    await profile.delete()
  }
}
