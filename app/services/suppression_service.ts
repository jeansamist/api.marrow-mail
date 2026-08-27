import SuppressedAddressRepository from '#repositories/suppressed_address_repository'
import { inject } from '@adonisjs/core'
import { Logger } from '@adonisjs/core/logger'
import { DateTime } from 'luxon'

type SuppressionReason = 'bounce' | 'complaint'

// Soft/transient bounces are often temporary (mailbox full, greylisting) — only a
// hard bounce means the address is permanently undeliverable and worth suppressing.
const HARD_BOUNCE_TYPE = 'Permanent'

@inject()
export class SuppressionService {
  constructor(
    private readonly repository: SuppressedAddressRepository,
    private readonly logger: Logger
  ) {}

  async isSuppressed(email: string): Promise<boolean> {
    const existing = await this.repository.findByEmail(this.normalize(email))
    if (existing) {
      this.logger.info(
        `Recipient suppressed for email: ${email} reason: ${existing.reason} bounce type: ${existing.bounceType ?? 'none'}`
      )
    }
    return existing !== null
  }

  async recordBounce(email: string, bounceType: string): Promise<void> {
    if (bounceType !== HARD_BOUNCE_TYPE) {
      this.logger.info(
        `Ignore non-permanent bounce for email: ${email} type: ${bounceType || 'unknown'}`
      )
      return
    }
    this.logger.info(`Record hard bounce for email: ${email} type: ${bounceType}`)
    await this.suppress(email, 'bounce', bounceType)
  }

  async recordComplaint(email: string): Promise<void> {
    this.logger.info(`Record complaint for email: ${email}`)
    await this.suppress(email, 'complaint', null)
  }

  private async suppress(
    email: string,
    reason: SuppressionReason,
    bounceType: string | null
  ): Promise<void> {
    const normalized = this.normalize(email)
    const existing = await this.repository.findByEmail(normalized)
    const lastEventAt = DateTime.now()

    if (!existing) {
      await this.repository.create({ email: normalized, reason, bounceType, lastEventAt })
      this.logger.warn(`Suppressed ${normalized} (${reason})`)
      return
    }

    // A complaint is the stronger signal — a later bounce shouldn't downgrade it.
    if (existing.reason === 'complaint') {
      this.logger.info(
        `Keep complaint suppression for email: ${normalized}: ignore later ${reason} and refresh last event`
      )
      await this.repository.update(existing, { lastEventAt })
      return
    }

    this.logger.info(
      `Update suppression for email: ${normalized} from reason: ${existing.reason} to reason: ${reason}`
    )
    await this.repository.update(existing, { reason, bounceType, lastEventAt })
  }

  private normalize(email: string): string {
    return email.toLowerCase().trim()
  }
}
