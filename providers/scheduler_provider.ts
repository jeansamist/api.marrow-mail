import { DomainRegistrationDispatchService } from '#services/domain_registration_dispatch_service'
import { ScheduledMailDispatchService } from '#services/scheduled_mail_dispatch_service'
import { type ApplicationService } from '@adonisjs/core/types'
import CronManager from '../app/managers/crons_manager.js'

const SCHEDULED_MAILS_JOB = 'scheduled-mails-dispatch'
const DOMAIN_REGISTRATION_POLL_JOB = 'domain-registration-poll'

/**
 * Registers the recurring cron job that dispatches mail scheduled ahead of
 * time via MailService.scheduleMail, once its send time has passed.
 *
 * Runs only in the web environment (see adonisrc.ts), and stops the job on
 * shutdown so it can't fire against a connection that's being torn down.
 */
export default class SchedulerProvider {
  constructor(protected app: ApplicationService) {}

  #cronManager?: CronManager

  async ready() {
    this.#cronManager = await this.app.container.make(CronManager)

    this.#cronManager.addProgrammedJob(SCHEDULED_MAILS_JOB, {
      cronTime: '* * * * *',
      handler: async () => {
        const dispatchService = await this.app.container.make(ScheduledMailDispatchService)
        await dispatchService.dispatchDueMails()
      },
    })

    this.#cronManager.addProgrammedJob(DOMAIN_REGISTRATION_POLL_JOB, {
      cronTime: '* * * * *',
      handler: async () => {
        const dispatchService = await this.app.container.make(DomainRegistrationDispatchService)
        await dispatchService.pollPendingRegistrations()
      },
    })
  }

  async shutdown() {
    this.#cronManager?.stopJob(SCHEDULED_MAILS_JOB)
    this.#cronManager?.stopJob(DOMAIN_REGISTRATION_POLL_JOB)
  }
}
