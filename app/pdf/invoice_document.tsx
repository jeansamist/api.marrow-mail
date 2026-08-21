import { Document, Page, Path, renderToBuffer, StyleSheet, Svg, Text, View } from '@react-pdf/renderer'
import React from 'react'

export interface InvoiceLineItem {
  description: string
  amount: number
}

export interface InvoiceData {
  invoiceNumber: string
  date: string
  currency: string
  billTo: {
    name: string
    email: string
    businessName?: string | null
    addressLines?: string[]
  }
  items: InvoiceLineItem[]
  total: number
}

// Stripe's own zero-decimal-currency list, restricted to the currencies this
// app actually charges in (see #utils/currency_for_country).
const ZERO_DECIMAL_CURRENCIES = new Set(['XAF', 'XOF'])

export function formatInvoiceMoney(amountRaw: number, currency: string): string {
  const upper = currency.toUpperCase()
  const isZeroDecimal = ZERO_DECIMAL_CURRENCIES.has(upper)
  const value = isZeroDecimal ? amountRaw : amountRaw / 100
  const formatted = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: isZeroDecimal ? 0 : 2,
    maximumFractionDigits: isZeroDecimal ? 0 : 2,
  }).format(value)
  return `${formatted} ${upper}`
}

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 10, fontFamily: 'Helvetica', color: '#1a1a1a' },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 36,
  },
  logoRow: { flexDirection: 'row', alignItems: 'center' },
  wordmark: { fontSize: 15, fontWeight: 700, marginLeft: 8 },
  invoiceTitle: { fontSize: 16, fontWeight: 700, textAlign: 'right', letterSpacing: 1 },
  meta: { fontSize: 9, color: '#666', textAlign: 'right', marginTop: 3 },
  section: { marginBottom: 22 },
  label: { fontSize: 8, color: '#888', marginBottom: 4 },
  billToName: { fontSize: 11, fontWeight: 700 },
  billToLine: { fontSize: 9, color: '#444', marginTop: 1 },
  tableHeaderRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a1a',
    paddingBottom: 6,
    marginBottom: 2,
  },
  tableHeaderText: { fontSize: 8, fontWeight: 700, color: '#666' },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  colDescription: { flex: 1, paddingRight: 12 },
  colAmount: { width: 90, textAlign: 'right' },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#1a1a1a',
  },
  totalLabel: { fontSize: 11, fontWeight: 700, marginRight: 24 },
  totalAmount: { fontSize: 13, fontWeight: 700 },
  footer: {
    position: 'absolute',
    bottom: 40,
    left: 40,
    right: 40,
    fontSize: 8,
    color: '#999',
    textAlign: 'center',
  },
})

// The MarrowMail icon mark's fixed brand-color facets, extracted from
// components/brand/logo.tsx in the frontend — kept in sync manually since
// there's no shared package between the two repos.
function LogoMark() {
  return (
    <Svg width={20} height={22} viewBox="0 0 212 237">
      <Path d="M211.01 84.71V85.92L138.66 236.31H135.32L86.3305 198.11L69.4805 184.97L211.01 84.71Z" fill="#5C8001" />
      <Path d="M211.01 85.92V223.61C211.01 230.62 205.32 236.31 198.31 236.31H138.66L211.01 85.92Z" fill="#7CB518" />
      <Path d="M211.01 80.34V83.47L0 130.8V88.66C0 84.92 1.69 81.38 4.6 79.04L99.25 2.74C103.78 -0.91 110.24 -0.91 114.77 2.74L211.01 80.34Z" fill="#FB6107" />
      <Path d="M135.32 236.31H11.75C5.26 236.31 0 231.05 0 224.56V130.8L46.03 166.7L57.27 224.24L86.33 198.11L135.31 236.3L135.32 236.31Z" fill="#FBB02D" />
      <Path d="M211.01 84.02V84.71L69.4802 184.97L68.6702 184.34L46.0302 166.7L45.4902 163.84L211.01 84.02Z" fill="#FB6107" />
      <Path d="M211.01 84.02L45.49 163.84L46.03 166.7L0 130.8L211.01 83.48V84.02Z" fill="#F3DE2C" />
      <Path d="M86.3295 198.11L57.2695 224.25L68.6695 184.34L69.4795 184.97L86.3295 198.11Z" fill="#5C8001" />
      <Path d="M68.6703 184.34L57.2703 224.25L46.0303 166.7L68.6703 184.34Z" fill="#FB6107" />
    </Svg>
  )
}

export function InvoiceDocument({ data }: { data: InvoiceData }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.headerRow}>
          <View style={styles.logoRow}>
            <LogoMark />
            <Text style={styles.wordmark}>MarrowMail</Text>
          </View>
          <View>
            <Text style={styles.invoiceTitle}>INVOICE</Text>
            <Text style={styles.meta}>{data.invoiceNumber}</Text>
            <Text style={styles.meta}>{data.date}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>BILLED TO</Text>
          <Text style={styles.billToName}>{data.billTo.name}</Text>
          {data.billTo.businessName && (
            <Text style={styles.billToLine}>{data.billTo.businessName}</Text>
          )}
          <Text style={styles.billToLine}>{data.billTo.email}</Text>
          {(data.billTo.addressLines ?? []).map((line, i) => (
            <Text key={i} style={styles.billToLine}>
              {line}
            </Text>
          ))}
        </View>

        <View>
          <View style={styles.tableHeaderRow}>
            <Text style={[styles.colDescription, styles.tableHeaderText]}>DESCRIPTION</Text>
            <Text style={[styles.colAmount, styles.tableHeaderText]}>AMOUNT</Text>
          </View>
          {data.items.map((item, i) => (
            <View key={i} style={styles.tableRow}>
              <Text style={styles.colDescription}>{item.description}</Text>
              <Text style={styles.colAmount}>
                {formatInvoiceMoney(item.amount, data.currency)}
              </Text>
            </View>
          ))}
        </View>

        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalAmount}>{formatInvoiceMoney(data.total, data.currency)}</Text>
        </View>

        <Text style={styles.footer}>
          MarrowMail — Thank you for your business. Questions about this invoice? Contact
          support@marrowmail.com.
        </Text>
      </Page>
    </Document>
  )
}

// renderToBuffer's types require its argument to literally be typed as a
// <Document> element, not a wrapper component around one — even though a
// wrapper works fine at runtime. Casting here, once, keeps that known
// react-pdf typing gap contained next to the component it concerns.
export function renderInvoicePdf(data: InvoiceData): Promise<Buffer> {
  return renderToBuffer(
    React.createElement(InvoiceDocument, { data }) as React.ReactElement<
      React.ComponentProps<typeof Document>
    >
  )
}
