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

interface InvoiceEmailProps {
  firstName: string
  invoiceNumber: string
  description: string
  totalFormatted: string
}

export function InvoiceEmailTemplate({
  firstName,
  invoiceNumber,
  description,
  totalFormatted,
}: InvoiceEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Your MarrowMail invoice {invoiceNumber} — {totalFormatted}</Preview>
      <Tailwind>
        <Body className="bg-white font-sans m-0 py-12">
          <Container className="max-w-[540px] mx-auto px-6">
            <Text className="text-base font-semibold m-0 mb-8" style={{ color: '#5C8001' }}>
              MarrowMail
            </Text>

            <Heading className="text-2xl font-semibold text-gray-900 m-0 mb-4 leading-snug">
              Thanks for your payment, {firstName}.
            </Heading>

            <Text className="text-gray-500 text-sm leading-relaxed m-0 mb-3">
              We've received your payment for {description}. Your invoice ({invoiceNumber}) for{' '}
              {totalFormatted} is attached to this email as a PDF.
            </Text>

            <Hr className="border-gray-100 my-10" />

            <Text className="text-xs text-gray-400 m-0 mb-1">
              You're receiving this because a payment was made on your MarrowMail account.
            </Text>
            <Text className="text-xs text-gray-400 m-0">
              Questions about this invoice? Contact support@marrowmails.com.
            </Text>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  )
}
