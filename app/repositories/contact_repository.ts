import { type ContactSchema } from '#database/schema'
import Contact from '#models/contact'
import { type ModelProps } from '#utils/generics'

export default class ContactRepository {
  private model = Contact

  async create(data: ModelProps<ContactSchema>): Promise<Contact> {
    return this.model.create(data)
  }

  async findById(id: number): Promise<Contact | null> {
    return this.model.find(id)
  }

  async findByMailAccountAndEmail(mailAccountId: number, email: string): Promise<Contact | null> {
    return this.model.query().where('mail_account_id', mailAccountId).where('email', email).first()
  }

  async findByMailAccount(mailAccountId: number): Promise<Contact[]> {
    return this.model.query().where('mail_account_id', mailAccountId).orderBy('first_name', 'asc')
  }

  async search(mailAccountId: number, query: string): Promise<Contact[]> {
    const term = `%${query}%`
    return this.model
      .query()
      .where('mail_account_id', mailAccountId)
      .where((builder) => {
        builder
          .whereILike('first_name', term)
          .orWhereILike('last_name', term)
          .orWhereILike('email', term)
          .orWhereILike('company', term)
      })
      .orderBy('first_name', 'asc')
  }

  async update(contact: Contact, data: Partial<ModelProps<ContactSchema>>): Promise<Contact> {
    return contact.merge(data).save()
  }

  async delete(contact: Contact): Promise<void> {
    await contact.delete()
  }
}
