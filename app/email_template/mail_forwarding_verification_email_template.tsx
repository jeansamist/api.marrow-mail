import {
    Body,
    Button,
    Container,
    Head,
    Heading,
    Hr,
    Html,
    Link,
    Preview,
    Tailwind,
    Text,
} from '@react-email/components'
import React from 'react'

interface MailForwardingVerificationEmailProps {
  mailAccountEmail: string
  verificationLink: string
}

export function MailForwardingVerificationEmailTemplate({
  mailAccountEmail,
  verificationLink,
}: MailForwardingVerificationEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Confirm mail forwarding for {mailAccountEmail}.</Preview>
      <Tailwind>
        <Body className="bg-white font-sans m-0 py-12">
          <Container className="max-w-[540px] mx-auto px-6">
            <Text className="text-base font-semibold m-0 mb-8" style={{ color: '#ea580c' }}>
              AppName
            </Text>

            <Heading className="text-2xl font-semibold text-gray-900 m-0 mb-4 leading-snug">
              Confirm this forwarding address.
            </Heading>

            <Text className="text-gray-500 text-sm leading-relaxed m-0 mb-3">
              A request was made to forward incoming mail from the following mailbox to this
              address:
            </Text>

            <Text
              className="text-sm font-medium m-0 mb-6 px-4 py-3 rounded-md"
              style={{ backgroundColor: '#f9fafb', color: '#111827', fontFamily: 'monospace' }}
            >
              {mailAccountEmail}
            </Text>

            <Text className="text-gray-500 text-sm leading-relaxed m-0 mb-8">
              Click the button below to confirm. This link expires in 1 hour.
            </Text>

            <Button
              href={verificationLink}
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
              Confirm forwarding
            </Button>

            <Text className="text-xs text-gray-400 m-0 mt-8 mb-1">
              Or copy and paste this URL into your browser:
            </Text>
            <Link
              href={verificationLink}
              className="text-xs break-all"
              style={{ color: '#ea580c' }}
            >
              {verificationLink}
            </Link>

            <Hr className="border-gray-100 my-10" />

            <Text className="text-xs text-gray-400 m-0">
              If you didn't request this, you can ignore this email — forwarding won't be enabled
              without confirmation.
            </Text>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  )
}
