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

interface PasswordResetAlertEmailProps {
  firstName: string
  resetAt: string
}

export function PasswordResetAlertEmailTemplate({
  firstName,
  resetAt,
}: PasswordResetAlertEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Your AppName password was changed.</Preview>
      <Tailwind>
        <Body className="bg-white font-sans m-0 py-12">
          <Container className="max-w-[540px] mx-auto px-6">
            <Text className="text-base font-semibold m-0 mb-8" style={{ color: '#ea580c' }}>
              AppName
            </Text>

            <Heading className="text-2xl font-semibold text-gray-900 m-0 mb-4 leading-snug">
              Your password was changed, {firstName}.
            </Heading>

            <Text className="text-gray-500 text-sm leading-relaxed m-0 mb-6">
              The password for your AppName account was successfully updated on{' '}
              <span className="text-gray-700 font-medium">{resetAt}</span>.
            </Text>

            <Text className="text-gray-500 text-sm leading-relaxed m-0 mb-8">
              If you made this change, everything is in order. If you did not, your account may be
              compromised — act immediately.
            </Text>

            <Button
              href="https://AppName.app/auth/reset-password"
              style={{
                backgroundColor: '#111827',
                color: '#ffffff',
                padding: '10px 24px',
                borderRadius: '6px',
                fontWeight: '500',
                fontSize: '14px',
                textDecoration: 'none',
                display: 'inline-block',
              }}
            >
              Secure my account
            </Button>

            <Hr className="border-gray-100 my-10" />

            <Text className="text-xs text-gray-400 m-0">
              You're receiving this because a password change was made on your AppName account.
            </Text>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  )
}
