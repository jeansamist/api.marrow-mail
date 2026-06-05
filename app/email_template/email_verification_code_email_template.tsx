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

interface EmailVerificationCodeEmailProps {
  firstName: string
  emailVerificationCode: string
}

export function EmailVerificationCodeEmailTemplate({
  firstName,
  emailVerificationCode,
}: EmailVerificationCodeEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Your AppName verification code: {emailVerificationCode}</Preview>
      <Tailwind>
        <Body className="bg-white font-sans m-0 py-12">
          <Container className="max-w-[540px] mx-auto px-6">
            <Text className="text-base font-semibold m-0 mb-8" style={{ color: '#ea580c' }}>
              AppName
            </Text>

            <Heading className="text-2xl font-semibold text-gray-900 m-0 mb-4 leading-snug">
              Verify your email, {firstName}.
            </Heading>

            <Text className="text-gray-500 text-sm leading-relaxed m-0 mb-8">
              Use the code below to confirm your email address and activate your account.
            </Text>

            <Text
              className="font-mono font-bold tracking-[0.25em] text-gray-900 m-0 mb-2"
              style={{ fontSize: '36px', lineHeight: '1' }}
            >
              {emailVerificationCode}
            </Text>

            <Text className="text-xs text-gray-400 m-0 mb-8">Expires in 15 minutes.</Text>

            <Text className="text-gray-500 text-sm leading-relaxed m-0 mb-0">
              If you didn't request this, you can ignore this email.
            </Text>

            <Hr className="border-gray-100 my-10" />

            <Text className="text-xs text-gray-400 m-0">
              Never share this code with anyone. AppName will never ask for it.
            </Text>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  )
}
