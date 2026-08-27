import ContactRepository from '#repositories/contact_repository'
import { AuthMailAccountService } from '#services/auth_mail_account_service'
import { httpError } from '#utils/http_error'
import { inject } from '@adonisjs/core'
import { Logger } from '@adonisjs/core/logger'

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
    private readonly authMailAccountService: AuthMailAccountService,
    private readonly logger: Logger
  ) {}

  async createContact(
    data: Required<Pick<ContactPayload, 'firstName' | 'email'>> & ContactPayload
  ) {
    const mailAccount = await this.authMailAccountService.getRequestMailAccount()
    this.logger.info(`Create contact: ${data.email} for mail account: ${mailAccount.id}`)

    const existing = await this.contactRepository.findByMailAccountAndEmail(
      mailAccount.id,
      data.email
    )
    if (existing) {
      this.logger.warn(
        `Create contact rejected for mail account: ${mailAccount.id}: email already used by contact: ${existing.id} email: ${data.email}`
      )
      throw httpError(409, 'A contact with this email already exists')
    }

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
      this.logger.info(`Search contacts for mail account: ${mailAccount.id} query: ${query.trim()}`)
      return this.contactRepository.search(mailAccount.id, query.trim())
    }
    this.logger.info(`List contacts for mail account: ${mailAccount.id}`)
    return this.contactRepository.findByMailAccount(mailAccount.id)
  }

  async getContact(id: number) {
    const { contact } = await this.getOwnedContact(id)
    this.logger.info(`Get contact: ${contact.id} for mail account: ${contact.mailAccountId}`)
    return contact
  }

  async updateContact(id: number, data: ContactPayload) {
    const { mailAccount, contact } = await this.getOwnedContact(id)
    this.logger.info(`Update contact: ${contact.id} for mail account: ${mailAccount.id}`)

    if (data.email !== undefined && data.email !== contact.email) {
      const existing = await this.contactRepository.findByMailAccountAndEmail(
        mailAccount.id,
        data.email
      )
      if (existing) {
        this.logger.warn(
          `Update contact rejected for contact: ${contact.id} mail account: ${mailAccount.id}: email already used by contact: ${existing.id} email: ${data.email}`
        )
        throw httpError(409, 'A contact with this email already exists')
      }
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
    this.logger.info(`Delete contact: ${contact.id} for mail account: ${contact.mailAccountId}`)
    await this.contactRepository.delete(contact)
  }

  private async getOwnedContact(id: number) {
    const mailAccount = await this.authMailAccountService.getRequestMailAccount()
    const contact = await this.contactRepository.findById(id)
    if (!contact || contact.mailAccountId !== mailAccount.id) {
      this.logger.warn(
        `Contact not found: ${id} for mail account: ${mailAccount.id}: ${contact ? 'belongs to another mail account' : 'no such contact'}`
      )
      throw httpError(404, 'Contact not found')
    }
    return { mailAccount, contact }
  }
}
