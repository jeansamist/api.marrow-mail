import MailAccount from '#models/mail_account'
import User from '#models/user'
import ContactRepository from '#repositories/contact_repository'
import { test } from '@japa/runner'

test.group('ContactRepository', (group) => {
  const contactRepository = new ContactRepository()
  const userEmail = 'contact-repo.tester@example.com'
  let user: User
  let mailAccount: MailAccount

  group.setup(async () => {
    user = await User.create({
      firstName: 'Contact',
      lastName: 'Tester',
      email: userEmail,
      password: 'password',
    })
    mailAccount = await MailAccount.create({
      cuid: 'contact-repo-test-account',
      username: 'contact-repo-tester',
      password: 'password',
      setuped: true,
      userId: user.id,
    })
  })

  group.teardown(async () => {
    await mailAccount.delete()
    await user.delete()
  })

  test('creates a contact scoped to a mail account', async ({ assert }) => {
    const contact = await contactRepository.create({
      mailAccountId: mailAccount.id,
      firstName: 'Ada',
      lastName: 'Lovelace',
      email: 'ada@example.com',
      phone: null,
      company: null,
      notes: null,
    })

    assert.equal(contact.firstName, 'Ada')
    assert.equal(contact.email, 'ada@example.com')
  })

  test('findByMailAccountAndEmail finds an existing contact by email', async ({ assert }) => {
    await contactRepository.create({
      mailAccountId: mailAccount.id,
      firstName: 'Grace',
      lastName: 'Hopper',
      email: 'grace@example.com',
      phone: null,
      company: null,
      notes: null,
    })

    const found = await contactRepository.findByMailAccountAndEmail(
      mailAccount.id,
      'grace@example.com'
    )
    const missing = await contactRepository.findByMailAccountAndEmail(
      mailAccount.id,
      'nobody@example.com'
    )

    assert.isNotNull(found)
    assert.isNull(missing)
  })

  test('search matches by first name, last name, email or company', async ({ assert }) => {
    const contact = await contactRepository.create({
      mailAccountId: mailAccount.id,
      firstName: 'Katherine',
      lastName: 'Johnson',
      email: 'katherine@nasa.example.com',
      phone: null,
      company: 'NASA',
      notes: null,
    })

    const byName = await contactRepository.search(mailAccount.id, 'kather')
    const byCompany = await contactRepository.search(mailAccount.id, 'nasa')
    const byNothing = await contactRepository.search(mailAccount.id, 'nonexistent')

    assert.isTrue(byName.some((c) => c.id === contact.id))
    assert.isTrue(byCompany.some((c) => c.id === contact.id))
    assert.isFalse(byNothing.some((c) => c.id === contact.id))
  })

  test('update changes contact fields', async ({ assert }) => {
    const contact = await contactRepository.create({
      mailAccountId: mailAccount.id,
      firstName: 'Margaret',
      lastName: 'Hamilton',
      email: 'margaret@example.com',
      phone: null,
      company: null,
      notes: null,
    })

    const updated = await contactRepository.update(contact, { company: 'MIT' })

    assert.equal(updated.company, 'MIT')
  })

  test('delete removes a contact', async ({ assert }) => {
    const contact = await contactRepository.create({
      mailAccountId: mailAccount.id,
      firstName: 'Temp',
      lastName: null,
      email: 'temp@example.com',
      phone: null,
      company: null,
      notes: null,
    })

    await contactRepository.delete(contact)

    const found = await contactRepository.findById(contact.id)
    assert.isNull(found)
  })
})
