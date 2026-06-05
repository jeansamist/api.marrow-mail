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

interface WelcomeEmailProps {
  firstName: string
}

export function WelcomeEmailTemplate({ firstName }: WelcomeEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Welcome to AppName, {firstName}.</Preview>
      <Tailwind>
        <Body className="bg-white font-sans m-0 py-12">
          <Container className="max-w-[540px] mx-auto px-6">
            <Text className="text-base font-semibold m-0 mb-8" style={{ color: '#ea580c' }}>
              AppName
            </Text>

            <Heading className="text-2xl font-semibold text-gray-900 m-0 mb-4 leading-snug">
              Welcome, {firstName}.
            </Heading>

            <Text className="text-gray-500 text-sm leading-relaxed m-0 mb-3">
              Your account is ready. You can now track your expenses, set savings goals, and get a
              clear picture of your finances — all in one place.
            </Text>

            <Text className="text-gray-500 text-sm leading-relaxed m-0 mb-8">
              We're glad to have you with us.
            </Text>

            <Button
              href="https://AppName.app/app/dashboard"
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
              Open AppName
            </Button>

            <Hr className="border-gray-100 my-10" />

            <Text className="text-xs text-gray-400 m-0 mb-1">
              You're receiving this because you created a AppName account.
            </Text>
            <Text className="text-xs text-gray-400 m-0">
              If this wasn't you, you can safely ignore this email.
            </Text>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  )
}
