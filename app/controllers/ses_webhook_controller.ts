import { EmailReceivingService } from '#services/email_receiving_service'
import { inject } from '@adonisjs/core'
import { Logger } from '@adonisjs/core/logger'
import type { HttpContext } from '@adonisjs/core/http'

interface SNSNotification {
  Type: 'SubscriptionConfirmation' | 'Notification' | 'UnsubscribeConfirmation'
  MessageId: string
  TopicArn: string
  Subject?: string
  Message: string
  SubscribeURL?: string
  Timestamp: string
  SignatureVersion: string
  Signature: string
  SigningCertURL: string
}

@inject()
export default class SesWebhookController {
  constructor(
    private readonly emailReceivingService: EmailReceivingService,
    private readonly logger: Logger
  ) {}

  async handle({ request, response }: HttpContext) {
    const notification = request.body() as SNSNotification

    if (!notification.Type) {
      return response.badRequest({ error: 'Invalid SNS notification' })
    }

    // Verify the message originates from AWS SNS
    const certUrl = notification.SigningCertURL ?? ''
    if (!certUrl.match(/^https:\/\/sns\.[a-z0-9-]+\.amazonaws\.com\//)) {
      return response.forbidden({ error: 'Invalid SNS source' })
    }

    if (notification.Type === 'SubscriptionConfirmation' && notification.SubscribeURL) {
      await fetch(notification.SubscribeURL)
      this.logger.info(`SNS subscription confirmed for topic ${notification.TopicArn}`)
      return response.ok({ confirmed: true })
    }

    if (notification.Type === 'Notification') {
      let message: Record<string, unknown>
      try {
        message = JSON.parse(notification.Message)
      } catch {
        return response.badRequest({ error: 'Invalid notification message' })
      }

      if (message['notificationType'] === 'Received') {
        this.emailReceivingService.processIncomingEmail(message as any).catch((error: unknown) => {
          this.logger.error(
            `Failed to process incoming email: ${error instanceof Error ? error.message : String(error)}`
          )
        })
      }
    }

    return response.ok({ received: true })
  }
}
