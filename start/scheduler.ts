/*
|--------------------------------------------------------------------------
| Scheduler
|--------------------------------------------------------------------------
|
| Registers the recurring cron job that dispatches mail scheduled ahead of
| time via MailService.scheduleMail, once its send time has passed.
|
*/

import { ScheduledMailDispatchService } from '#services/scheduled_mail_dispatch_service'
import app from '@adonisjs/core/services/app'
import CronManager from '../app/managers/crons_manager.js'

const cronManager = await app.container.make(CronManager)

cronManager.addProgrammedJob('scheduled-mails-dispatch', {
  cronTime: '* * * * *',
  handler: async () => {
    const dispatchService = await app.container.make(ScheduledMailDispatchService)
    await dispatchService.dispatchDueMails()
  },
})
