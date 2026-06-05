import { CronJob, type CronJobParams } from 'cron'

type CronTask = () => void | Promise<void>
type QueueOrder = 'fifo' | 'lifo' | 'lilo'

type RetryFailureHook = (payload: {
  jobName: string
  attempt: number
  retriesLeft: number
  error: unknown
}) => void | Promise<void>

type RetriesExhaustedHook = (payload: {
  jobName: string
  attempts: number
  error: unknown
}) => void | Promise<void>

interface RetryOptions {
  retries?: number
  retryDelayMs?: number
  onFailure?: RetryFailureHook
  onRetriesExhausted?: RetriesExhaustedHook
}

type CronTimeConfig =
  | {
      timeZone?: string | null
      utcOffset?: never
    }
  | {
      timeZone?: never
      utcOffset?: number | null
    }

interface ProgrammedJobBaseOptions extends RetryOptions {
  cronTime: CronJobParams['cronTime']
  start?: boolean
  runOnInit?: boolean
  waitForCompletion?: boolean
  unrefTimeout?: boolean
  errorHandler?: (error: unknown) => void
  threshold?: number
}

type ProgrammedJobOptions = ProgrammedJobBaseOptions &
  CronTimeConfig & {
    handler: CronTask
  }

interface QueuedJobOptions extends RetryOptions {
  jobName?: string
  order?: QueueOrder
}

interface QueuedJobItem {
  name: string
  handler: CronTask
  retryOptions: RetryOptions
}

interface JobQueueState {
  order: 'fifo' | 'lifo'
  isRunning: boolean
  items: QueuedJobItem[]
}

export default class CronManager {
  private readonly jobs = new Map<string, CronJob>()
  private readonly queues = new Map<string, JobQueueState>()

  getCron(name: string, opts?: CronJobParams): CronJob {
    if (!this.jobs.has(name)) {
      if (!opts) {
        throw new Error(`Cron job "${name}" is not registered`)
      }

      const job = CronJob.from({
        ...opts,
        name: opts.name ?? name,
      })

      this.jobs.set(name, job)
    }

    return this.jobs.get(name)!
  }

  addJob(name: string, opts: CronJobParams): CronJob {
    return this.getCron(name, opts)
  }

  createCron(opts: CronJobParams): CronJob {
    return CronJob.from(opts)
  }

  addProgrammedJob(name: string, options: ProgrammedJobOptions): CronJob {
    return this.getCron(
      name,
      this.toCronJobParams(name, options, () =>
        this.executeWithRetry(name, options.handler, options)
      )
    )
  }

  addQueueJob(queueName: string, handler: CronTask, options: QueuedJobOptions = {}): void {
    const queue = this.getQueue(queueName, options.order)

    if (options.order) {
      const expectedOrder = this.normalizeOrder(options.order)
      const hasPendingItems = queue.items.length > 0 || queue.isRunning

      if (queue.order !== expectedOrder && hasPendingItems) {
        throw new Error(
          `Queue "${queueName}" is active with "${queue.order}" order. Wait for it to drain before changing order.`
        )
      }

      queue.order = expectedOrder
    }

    queue.items.push({
      name: options.jobName ?? queueName,
      handler,
      retryOptions: options,
    })

    void this.processQueue(queueName)
  }

  stopJob(name: string): void {
    this.jobs.get(name)?.stop()
  }

  removeJob(name: string): void {
    this.stopJob(name)
    this.jobs.delete(name)
  }

  private getQueue(name: string, order: QueueOrder = 'fifo'): JobQueueState {
    if (!this.queues.has(name)) {
      this.queues.set(name, {
        order: this.normalizeOrder(order),
        isRunning: false,
        items: [],
      })
    }

    return this.queues.get(name)!
  }

  private normalizeOrder(order: QueueOrder): 'fifo' | 'lifo' {
    return order === 'fifo' ? 'fifo' : 'lifo'
  }

  private async processQueue(queueName: string): Promise<void> {
    const queue = this.queues.get(queueName)
    if (!queue || queue.isRunning) {
      return
    }

    queue.isRunning = true

    try {
      while (queue.items.length > 0) {
        const queueItem = queue.order === 'fifo' ? queue.items.shift()! : queue.items.pop()!

        try {
          await this.executeWithRetry(queueItem.name, queueItem.handler, queueItem.retryOptions)
        } catch (error) {
          // Keep queue processing alive even when a job exhausts retries.
          console.error(`Queue job "${queueItem.name}" failed after retries`, error)
        }
      }
    } finally {
      queue.isRunning = false
    }
  }

  private toCronJobParams(
    name: string,
    options: ProgrammedJobOptions,
    onTick: CronJobParams['onTick']
  ): CronJobParams {
    const baseParams = {
      cronTime: options.cronTime,
      onTick,
      start: options.start ?? true,
      runOnInit: options.runOnInit ?? false,
      waitForCompletion: options.waitForCompletion ?? true,
      unrefTimeout: options.unrefTimeout,
      errorHandler: options.errorHandler,
      threshold: options.threshold,
      name,
    }

    if ('utcOffset' in options) {
      const params: CronJobParams = {
        ...baseParams,
        utcOffset: options.utcOffset ?? undefined,
      }
      return params
    }

    if ('timeZone' in options) {
      const params: CronJobParams = {
        ...baseParams,
        timeZone: options.timeZone ?? undefined,
      }
      return params
    }

    const params: CronJobParams = baseParams
    return params
  }

  private async executeWithRetry(
    name: string,
    handler: CronTask,
    options: RetryOptions
  ): Promise<void> {
    const retries = options.retries ?? 0
    const retryDelayMs = options.retryDelayMs ?? 0
    const maxAttempts = retries + 1
    let lastError: unknown

    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
      try {
        await handler()
        return
      } catch (error) {
        lastError = error

        await options.onFailure?.({
          jobName: name,
          attempt,
          retriesLeft: maxAttempts - attempt,
          error,
        })

        const isLastAttempt = attempt === maxAttempts
        if (isLastAttempt) {
          await options.onRetriesExhausted?.({
            jobName: name,
            attempts: maxAttempts,
            error,
          })
          throw error
        }

        if (retryDelayMs > 0) {
          await this.sleep(retryDelayMs)
        }
      }
    }

    throw lastError
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(resolve, ms)
    })
  }
}
