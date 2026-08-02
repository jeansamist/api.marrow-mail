import MailAccount from '#models/mail_account'
import User from '#models/user'
import { ContactService } from '#services/contact_service'
import env from '#start/env'
import { HttpContext } from '@adonisjs/core/http'
import app from '@adonisjs/core/services/app'
import testUtils from '@adonisjs/core/services/test_utils'
import { test } from '@japa/runner'
import jwt from 'jsonwebtoken'
import { IncomingMessage } from 'node:http'
import { Socket } from 'node:net'

function httpStatus(error: unknown): number | undefined {
  return typeof error === 'object' && error !== null && 'status' in error
    ? (error as { status?: number }).status
    : undefined
}

async function bindMailAccountContext(mailAccountId: number) {
  const token = jwt.sign({ id: mailAccountId }, env.get('JWT_SECRET', 'key'))
  const req = new IncomingMessage(new Socket())
  req.headers = { authorization: `Bearer ${token}` }
  const ctx = await testUtils.createHttpContext({ req })
  app.container.bind(HttpContext, () => ctx)
}

test.group('ContactService', (group) => {
  const userEmail = 'contact-service.tester@example.com'
  let user: User
  let mailAccount: MailAccount
  let contactService: ContactService

  group.setup(async () => {
    user = await User.create({
      firstName: 'Contact',
      lastName: 'Tester',
      email: userEmail,
      password: 'password',
    })
    mailAccount = await MailAccount.create({
      cuid: 'contact-service-test-account',
      username: 'contact-service-tester',
      password: 'password',
      setuped: true,
      userId: user.id,
    })

    await bindMailAccountContext(mailAccount.id)
    contactService = await app.container.make(ContactService)
  })

  group.teardown(async () => {
    await mailAccount.delete()
    await user.delete()
  })

  test('createContact creates a contact and rejects a duplicate email', async ({ assert }) => {
    const contact = await contactService.createContact({
      firstName: 'Ada',
      lastName: 'Lovelace',
      email: 'ada@example.com',
    })
    assert.equal(contact.firstName, 'Ada')

    try {
      await contactService.createContact({ firstName: 'Ada 2', email: 'ada@example.com' })
      assert.fail('Expected createContact to reject a duplicate email')
    } catch (error) {
      assert.equal(httpStatus(error), 409)
    }
  })

  test('listContacts supports searching by name, email or company', async ({ assert }) => {
    const contact = await contactService.createContact({
      firstName: 'Katherine',
      lastName: 'Johnson',
      email: 'katherine@nasa.example.com',
      company: 'NASA',
    })

    const all = await contactService.listContacts()
    const byName = await contactService.listContacts('kather')
    const byCompany = await contactService.listContacts('nasa')
    const byNothing = await contactService.listContacts('nonexistent')

    assert.isTrue(all.some((c) => c.id === contact.id))
    assert.isTrue(byName.some((c) => c.id === contact.id))
    assert.isTrue(byCompany.some((c) => c.id === contact.id))
    assert.isFalse(byNothing.some((c) => c.id === contact.id))
  })

  test('getContact returns an owned contact', async ({ assert }) => {
    const contact = await contactService.createContact({
      firstName: 'Grace',
      email: 'grace@example.com',
    })

    const found = await contactService.getContact(contact.id)

    assert.equal(found.id, contact.id)
  })

  test('updateContact partially updates fields and rejects an email collision', async ({
    assert,
  }) => {
    const contact = await contactService.createContact({
      firstName: 'Margaret',
      email: 'margaret@example.com',
    })
    await contactService.createContact({ firstName: 'Taken', email: 'taken@example.com' })

    const updated = await contactService.updateContact(contact.id, { company: 'MIT' })
    assert.equal(updated.company, 'MIT')
    assert.equal(updated.firstName, 'Margaret')

    try {
      await contactService.updateContact(contact.id, { email: 'taken@example.com' })
      assert.fail('Expected updateContact to reject an email already in use')
    } catch (error) {
      assert.equal(httpStatus(error), 409)
    }
  })

  test('deleteContact removes a contact', async ({ assert }) => {
    const contact = await contactService.createContact({
      firstName: 'Temp',
      email: 'temp@example.com',
    })

    await contactService.deleteContact(contact.id)

    const contacts = await contactService.listContacts()
    assert.isFalse(contacts.some((c) => c.id === contact.id))
  })

  test('contact access is rejected across mail accounts', async ({ assert }) => {
    const otherUser = await User.create({
      firstName: 'Other',
      lastName: 'Tester',
      email: 'contact-service.other@example.com',
      password: 'password',
    })
    const otherMailAccount = await MailAccount.create({
      cuid: 'contact-service-other-account',
      username: 'contact-service-other',
      password: 'password',
      setuped: true,
      userId: otherUser.id,
    })

    await bindMailAccountContext(otherMailAccount.id)
    const otherContactService = await app.container.make(ContactService)
    const foreignContact = await otherContactService.createContact({
      firstName: 'Not yours',
      email: 'notyours@example.com',
    })

    await bindMailAccountContext(mailAccount.id)
    contactService = await app.container.make(ContactService)

    try {
      await contactService.getContact(foreignContact.id)
      assert.fail('Expected getContact to reject a contact owned by another mail account')
    } catch (error) {
      assert.equal(httpStatus(error), 404)
    }

    await otherMailAccount.delete()
    await otherUser.delete()
  })
})
