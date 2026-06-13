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

interface MailAccountCreatedEmailProps {
  mailAccountEmail: string
  setupLink: string
}

export function MailAccountCreatedEmailTemplate({ mailAccountEmail, setupLink }: MailAccountCreatedEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Your mail account {mailAccountEmail} is ready to set up.</Preview>
      <Tailwind>
        <Body className="bg-white font-sans m-0 py-12">
          <Container className="max-w-[540px] mx-auto px-6">
            <Text className="text-base font-semibold m-0 mb-8" style={{ color: '#ea580c' }}>
              AppName
            </Text>

            <Heading className="text-2xl font-semibold text-gray-900 m-0 mb-4 leading-snug">
              A mail account has been created for you.
            </Heading>

            <Text className="text-gray-500 text-sm leading-relaxed m-0 mb-3">
              The following mail account was created and assigned to you:
            </Text>

            <Text
              className="text-sm font-medium m-0 mb-6 px-4 py-3 rounded-md"
              style={{ backgroundColor: '#f9fafb', color: '#111827', fontFamily: 'monospace' }}
            >
              {mailAccountEmail}
            </Text>

            <Text className="text-gray-500 text-sm leading-relaxed m-0 mb-8">
              Click below to set up your account and choose your password.
            </Text>

            <Button
              href={setupLink}
              style={{
                backgroundColor: '#ea580c',
                color: '#ffffff',
                padding: '10px 24px',
                borderRadius: '6px',
                fontWeight: '500',
                fontSize: '14px',
                textDecoration: 'none',
                display: 'inline-block',
              }}
            >
              Set up my account
            </Button>

            <Hr className="border-gray-100 my-10" />

            <Text className="text-xs text-gray-400 m-0">
              You're receiving this because someone created a mail account for you. If this wasn't
              expected, you can safely ignore this email.
            </Text>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  )
}
