import env from '#start/env'
import { httpError } from '#utils/http_error'
import { createHmac, timingSafeEqual } from 'node:crypto'

export interface CreateElgiopayPaymentPayload {
  amount: number
  currency: 'XAF' | 'XOF' | 'EUR'
  payment_method: 'mtn_mobile_money' | 'orange_money'
  customer_phone: string
  customer_name: string
  customer_email?: string
  reference: string
  metadata?: Record<string, unknown>
}

export interface ElgiopayPaymentResponse {
  success: boolean
  transaction_id: string
  status: 'pending' | 'completed' | 'failed'
  payment_url: string | null
  message: string
}

export interface ElgiopayTransaction {
  transaction_id: string
  type: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  amount: { total: number; currency: string; fees?: number; net_amount?: number }
  payment: { method: string }
  customer: { phone: string; name?: string; email?: string }
  created_at: string
  updated_at?: string
  completed_at?: string
}

export class ElgiopayService {
  private readonly baseUrl = env.get('ELGIOPAY_API_BASE_URL')
  private readonly secretKey = env.get('ELGIOPAY_SECRET_KEY')

  async createPayment(payload: CreateElgiopayPaymentPayload): Promise<ElgiopayPaymentResponse> {
    const response = await fetch(`${this.baseUrl}/api/v1/payments`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.secretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      throw httpError(response.status, 'Elgiopay payment creation failed')
    }

    return response.json() as Promise<ElgiopayPaymentResponse>
  }

  async getPayment(transactionId: string): Promise<ElgiopayTransaction> {
    const response = await fetch(`${this.baseUrl}/api/v1/payments/${transactionId}`, {
      headers: { Authorization: `Bearer ${this.secretKey}` },
    })

    if (!response.ok) {
      throw httpError(response.status, 'Failed to fetch Elgiopay transaction')
    }

    return response.json() as Promise<ElgiopayTransaction>
  }

  verifySignature(rawBody: string, signatureHeader: string): boolean {
    const parts = Object.fromEntries(
      signatureHeader.split(',').map((part) => part.split('=') as [string, string])
    )

    const t = Number(parts.t)
    if (!t || Math.abs(Date.now() / 1000 - t) > 300) {
      return false
    }

    const expected = createHmac('sha256', env.get('ELGIOPAY_WEBHOOK_SECRET'))
      .update(`${t}.${rawBody}`)
      .digest('hex')

    const expectedBuffer = Buffer.from(expected, 'hex')
    const actualBuffer = Buffer.from(parts.v1 ?? '', 'hex')

    if (expectedBuffer.length !== actualBuffer.length) {
      return false
    }

    return timingSafeEqual(expectedBuffer, actualBuffer)
  }
}
