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

interface LoginAlertEmailProps {
  firstName: string
  loggedInAt: string
}

export function LoginAlertEmailTemplate({ firstName, loggedInAt }: LoginAlertEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>New sign-in to your AppName account.</Preview>
      <Tailwind>
        <Body className="bg-white font-sans m-0 py-12">
          <Container className="max-w-[540px] mx-auto px-6">
            <Text className="text-base font-semibold m-0 mb-8" style={{ color: '#ea580c' }}>
              AppName
            </Text>

            <Heading className="text-2xl font-semibold text-gray-900 m-0 mb-4 leading-snug">
              New sign-in detected, {firstName}.
            </Heading>

            <Text className="text-gray-500 text-sm leading-relaxed m-0 mb-6">
              A sign-in to your AppName account was recorded on{' '}
              <span className="text-gray-700 font-medium">{loggedInAt}</span>. If this was you, no
              action is needed.
            </Text>

            <Text className="text-gray-500 text-sm leading-relaxed m-0 mb-8">
              If you don't recognize this activity, secure your account immediately.
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
              You're receiving this alert because a new sign-in occurred on your account.
            </Text>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  )
}
