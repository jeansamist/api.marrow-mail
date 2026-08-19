import {
    Body,
    Button,
    Container,
    Head,
    Heading,
    Hr,
    Html,
    Preview,
    Tailwind,
    Text,
} from '@react-email/components'
import React from 'react'

interface MailAccountEntry {
  mailAccountEmail: string
  setupLink: string
}

interface MailAccountsCreatedBatchEmailProps {
  accounts: MailAccountEntry[]
}

export function MailAccountsCreatedBatchEmailTemplate({
  accounts,
}: MailAccountsCreatedBatchEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>{`${accounts.length} mail account${accounts.length > 1 ? 's' : ''} ready to set up.`}</Preview>
      <Tailwind>
        <Body className="bg-white font-sans m-0 py-12">
          <Container className="max-w-[540px] mx-auto px-6">
            <Text className="text-base font-semibold m-0 mb-8" style={{ color: '#ea580c' }}>
              AppName
            </Text>

            <Heading className="text-2xl font-semibold text-gray-900 m-0 mb-4 leading-snug">
              {accounts.length} mail account{accounts.length > 1 ? 's have' : ' has'} been created for you.
            </Heading>

            <Text className="text-gray-500 text-sm leading-relaxed m-0 mb-6">
              The following mail account{accounts.length > 1 ? 's were' : ' was'} created and
              assigned to you. Click each one to set up its password.
            </Text>

            {accounts.map((account) => (
              <Container
                key={account.mailAccountEmail}
                className="mb-4 px-4 py-3 rounded-md"
                style={{ backgroundColor: '#f9fafb' }}
              >
                <Text
                  className="text-sm font-medium m-0 mb-3"
                  style={{ color: '#111827', fontFamily: 'monospace' }}
                >
                  {account.mailAccountEmail}
                </Text>
                <Button
                  href={account.setupLink}
                  style={{
                    backgroundColor: '#ea580c',
                    color: '#ffffff',
                    padding: '8px 20px',
                    borderRadius: '6px',
                    fontWeight: '500',
                    fontSize: '13px',
                    textDecoration: 'none',
                    display: 'inline-block',
                  }}
                >
                  Set up this account
                </Button>
              </Container>
            ))}

            <Hr className="border-gray-100 my-10" />

            <Text className="text-xs text-gray-400 m-0">
              You're receiving this because someone created these mail accounts for you. If this
              wasn't expected, you can safely ignore this email.
            </Text>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  )
}
