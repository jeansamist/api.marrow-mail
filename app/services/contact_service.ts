import ContactRepository from '#repositories/contact_repository'
import { AuthMailAccountService } from '#services/auth_mail_account_service'
import { httpError } from '#utils/http_error'
import { inject } from '@adonisjs/core'

interface ContactPayload {
  firstName?: string
  lastName?: string
  email?: string
  phone?: string
  company?: string
  notes?: string
}

@inject()
export class ContactService {
  constructor(
    private readonly contactRepository: ContactRepository,
    private readonly authMailAccountService: AuthMailAccountService
  ) {}

  async createContact(
    data: Required<Pick<ContactPayload, 'firstName' | 'email'>> & ContactPayload
  ) {
    const mailAccount = await this.authMailAccountService.getRequestMailAccount()

    const existing = await this.contactRepository.findByMailAccountAndEmail(
      mailAccount.id,
      data.email
    )
    if (existing) throw httpError(409, 'A contact with this email already exists')

    return this.contactRepository.create({
      mailAccountId: mailAccount.id,
      firstName: data.firstName,
      lastName: data.lastName ?? null,
      email: data.email,
      phone: data.phone ?? null,
      company: data.company ?? null,
      notes: data.notes ?? null,
    })
  }

  async listContacts(query?: string) {
    const mailAccount = await this.authMailAccountService.getRequestMailAccount()
    if (query && query.trim().length > 0) {
      return this.contactRepository.search(mailAccount.id, query.trim())
    }
    return this.contactRepository.findByMailAccount(mailAccount.id)
  }

  async getContact(id: number) {
    const { contact } = await this.getOwnedContact(id)
    return contact
  }

  async updateContact(id: number, data: ContactPayload) {
    const { mailAccount, contact } = await this.getOwnedContact(id)

    if (data.email !== undefined && data.email !== contact.email) {
      const existing = await this.contactRepository.findByMailAccountAndEmail(
        mailAccount.id,
        data.email
      )
      if (existing) throw httpError(409, 'A contact with this email already exists')
    }

    return this.contactRepository.update(contact, {
      ...(data.firstName !== undefined && { firstName: data.firstName }),
      ...(data.lastName !== undefined && { lastName: data.lastName }),
      ...(data.email !== undefined && { email: data.email }),
      ...(data.phone !== undefined && { phone: data.phone }),
      ...(data.company !== undefined && { company: data.company }),
      ...(data.notes !== undefined && { notes: data.notes }),
    })
  }

  async deleteContact(id: number) {
    const { contact } = await this.getOwnedContact(id)
    await this.contactRepository.delete(contact)
  }

  private async getOwnedContact(id: number) {
    const mailAccount = await this.authMailAccountService.getRequestMailAccount()
    const contact = await this.contactRepository.findById(id)
    if (!contact || contact.mailAccountId !== mailAccount.id) {
      throw httpError(404, 'Contact not found')
    }
    return { mailAccount, contact }
  }
}
