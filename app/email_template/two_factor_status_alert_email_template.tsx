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

interface TwoFactorStatusAlertEmailProps {
  mailAccountEmail: string
  enabled: boolean
}

export function TwoFactorStatusAlertEmailTemplate({
  mailAccountEmail,
  enabled,
}: TwoFactorStatusAlertEmailProps) {
  const action = enabled ? 'enabled' : 'disabled'

  return (
    <Html>
      <Head />
      <Preview>Two-factor authentication was {action} for {mailAccountEmail}.</Preview>
      <Tailwind>
        <Body className="bg-white font-sans m-0 py-12">
          <Container className="max-w-[540px] mx-auto px-6">
            <Text className="text-base font-semibold m-0 mb-8" style={{ color: '#ea580c' }}>
              AppName
            </Text>

            <Heading className="text-2xl font-semibold text-gray-900 m-0 mb-4 leading-snug">
              Two-factor authentication {action}.
            </Heading>

            <Text className="text-gray-500 text-sm leading-relaxed m-0 mb-3">
              Two-factor authentication was just {action} for the following mail account:
            </Text>

            <Text
              className="text-sm font-medium m-0 mb-6 px-4 py-3 rounded-md"
              style={{ backgroundColor: '#f9fafb', color: '#111827', fontFamily: 'monospace' }}
            >
              {mailAccountEmail}
            </Text>

            <Text className="text-gray-500 text-sm leading-relaxed m-0 mb-8">
              If you made this change, everything is in order. If you did not, your account may be
              compromised — change your password immediately.
            </Text>

            <Hr className="border-gray-100 my-10" />

            <Text className="text-xs text-gray-400 m-0">
              You're receiving this because a two-factor authentication change was made on this
              mail account.
            </Text>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  )
}
