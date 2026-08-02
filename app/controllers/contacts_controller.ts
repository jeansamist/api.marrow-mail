import { ContactService } from '#services/contact_service'
import ContactTransformer from '#transformers/contact_transformer'
import { ApiResponse } from '#utils/api_response'
import { createContactValidator, updateContactValidator } from '#validators/contact'
import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'

@inject()
export default class ContactsController {
  constructor(private readonly contactService: ContactService) {}

  async index({ request, response, serialize }: HttpContext) {
    const query = request.input('q') as string | undefined
    const contacts = await this.contactService.listContacts(query)
    const serialized = await serialize(ContactTransformer.transform(contacts))
    return response.ok(ApiResponse.success(serialized.data, 'Contacts retrieved'))
  }

  async show({ params, response, serialize }: HttpContext) {
    const contact = await this.contactService.getContact(params.id)
    const serialized = await serialize(ContactTransformer.transform(contact))
    return response.ok(ApiResponse.success(serialized.data, 'Contact retrieved'))
  }

  async store({ request, response, serialize }: HttpContext) {
    const data = await request.validateUsing(createContactValidator)
    const contact = await this.contactService.createContact(data)
    const serialized = await serialize(ContactTransformer.transform(contact))
    return response.created(ApiResponse.success(serialized.data, 'Contact created'))
  }

  async update({ params, request, response, serialize }: HttpContext) {
    const data = await request.validateUsing(updateContactValidator)
    const contact = await this.contactService.updateContact(params.id, data)
    const serialized = await serialize(ContactTransformer.transform(contact))
    return response.ok(ApiResponse.success(serialized.data, 'Contact updated'))
  }

  async destroy({ params, response }: HttpContext) {
    await this.contactService.deleteContact(params.id)
    return response.ok(ApiResponse.success(null, 'Contact deleted'))
  }
}
