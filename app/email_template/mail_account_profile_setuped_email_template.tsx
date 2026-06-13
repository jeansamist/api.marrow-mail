import {
  Body,
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

interface MailAccountProfileSetupedEmailProps {
  firstName: string
  mailAccountEmail: string
}

export function MailAccountProfileSetupedEmailTemplate({
  firstName,
  mailAccountEmail,
}: MailAccountProfileSetupedEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Your profile for {mailAccountEmail} has been set up.</Preview>
      <Tailwind>
        <Body className="bg-white font-sans m-0 py-12">
          <Container className="max-w-[540px] mx-auto px-6">
            <Text className="text-base font-semibold m-0 mb-8" style={{ color: '#ea580c' }}>
              AppName
            </Text>

            <Heading className="text-2xl font-semibold text-gray-900 m-0 mb-4 leading-snug">
              Your profile is all set, {firstName}!
            </Heading>

            <Text className="text-gray-500 text-sm leading-relaxed m-0 mb-3">
              The profile for the following mail account has been successfully configured:
            </Text>

            <Text
              className="text-sm font-medium m-0 mb-6 px-4 py-3 rounded-md"
              style={{ backgroundColor: '#f9fafb', color: '#111827', fontFamily: 'monospace' }}
            >
              {mailAccountEmail}
            </Text>

            <Text className="text-gray-500 text-sm leading-relaxed m-0 mb-8">
              Your display name and preferences are now active on this account.
            </Text>

            <Hr className="border-gray-100 my-10" />

            <Text className="text-xs text-gray-400 m-0">
              You're receiving this because a profile was set up on a mail account linked to your
              address. If this wasn't you, please contact support immediately.
            </Text>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  )
}
