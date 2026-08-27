import env from '#start/env'
import { httpError } from '#utils/http_error'
import { inject } from '@adonisjs/core'
import { Logger } from '@adonisjs/core/logger'
import { createHmac, timingSafeEqual } from 'node:crypto'

export interface CreateElgiopayPaymentPayload {
  amount: number
  currency: 'XAF' | 'XOF' | 'USD'
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
  failure_reason?: string
  message: string
}

export interface ElgiopayTransaction {
  transaction_id: string
  type: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  amount: { total: number; currency: string; fees?: number; net_amount?: number }
  payment: { method: string }
  customer: { phone: string; name?: string; email?: string }
  metadata?: Record<string, unknown>
  failure_reason?: string
  created_at: string
  updated_at?: string
  completed_at?: string
  failed_at?: string
}
@inject()
export class ElgiopayService {
  private readonly baseUrl = env.get('ELGIOPAY_API_BASE_URL')
  private readonly secretKey = env.get('ELGIOPAY_SECRET_KEY')

  constructor(private readonly logger: Logger) {}

  async createPayment(payload: CreateElgiopayPaymentPayload): Promise<ElgiopayPaymentResponse> {
    this.logger.info(
      `Create a new Elgiopay payment for customer: ${payload.customer_phone} amount: ${payload.amount} currency: ${payload.currency} method: ${payload.payment_method} reference: ${payload.reference}`
    )
    const response = await fetch(`${this.baseUrl}/api/v1/payments`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.secretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      this.logger.error(
        `Elgiopay payment creation failed for reference: ${payload.reference} status: ${response.status} body: ${await this.readErrorBody(response)}`
      )
      throw httpError(response.status, 'Elgiopay payment creation failed')
    }

    const result = (await response.json()) as ElgiopayPaymentResponse

    if (result.success) {
      this.logger.info(
        `Elgiopay payment created for reference: ${payload.reference} transaction: ${result.transaction_id} status: ${result.status}`
      )
    } else {
      this.logger.warn(
        `Elgiopay payment not accepted for reference: ${payload.reference} transaction: ${result.transaction_id} status: ${result.status} reason: ${result.failure_reason ?? result.message}`
      )
    }

    return result
  }

  async getPayment(transactionId: string): Promise<ElgiopayTransaction> {
    this.logger.info(`Fetch Elgiopay transaction: ${transactionId}`)
    const response = await fetch(`${this.baseUrl}/api/v1/payments/${transactionId}`, {
      headers: { Authorization: `Bearer ${this.secretKey}` },
    })
    if (!response.ok) {
      this.logger.error(
        `Failed to fetch Elgiopay transaction: ${transactionId} status: ${response.status} body: ${await this.readErrorBody(response)}`
      )
      throw httpError(response.status, 'Failed to fetch Elgiopay transaction')
    }

    const transaction = (await response.json()) as ElgiopayTransaction
    this.logger.info(
      `Fetched Elgiopay transaction: ${transaction.transaction_id} status: ${transaction.status} amount: ${transaction.amount.total} currency: ${transaction.amount.currency}${transaction.failure_reason ? ` reason: ${transaction.failure_reason}` : ''}`
    )

    return transaction
  }

  verifySignature(rawBody: string, signatureHeader: string): boolean {
    const parts = Object.fromEntries(
      signatureHeader.split(',').map((part) => part.split('=') as [string, string])
    )

    const t = Number(parts.t)
    if (!t || Math.abs(Date.now() / 1000 - t) > 300) {
      this.logger.warn(
        `Elgiopay webhook signature rejected: ${t ? `timestamp ${t} is outside the 5 minutes tolerance` : 'missing or invalid timestamp'}`
      )
      return false
    }

    const expected = createHmac('sha256', env.get('ELGIOPAY_WEBHOOK_SECRET'))
      .update(`${t}.${rawBody}`)
      .digest('hex')

    const expectedBuffer = Buffer.from(expected, 'hex')
    const actualBuffer = Buffer.from(parts.v1 ?? '', 'hex')

    if (expectedBuffer.length !== actualBuffer.length) {
      this.logger.warn(
        `Elgiopay webhook signature rejected: ${parts.v1 ? 'signature length mismatch' : 'missing v1 signature'}`
      )
      return false
    }

    const valid = timingSafeEqual(expectedBuffer, actualBuffer)
    if (valid) {
      this.logger.info('Elgiopay webhook signature verified')
    } else {
      this.logger.warn('Elgiopay webhook signature rejected: signature mismatch')
    }

    return valid
  }

  private async readErrorBody(response: Response): Promise<string> {
    try {
      return await response.text()
    } catch {
      return '<unreadable>'
    }
  }
}
