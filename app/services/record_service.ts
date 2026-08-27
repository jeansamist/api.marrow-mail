import { RecordSchema } from '#database/schema'
import Record from '#models/record'
import RecordRepository from '#repositories/record_repository'
import { httpError } from '#utils/http_error'
import { inject } from '@adonisjs/core'
import { HttpContext } from '@adonisjs/core/http'
import { Logger } from '@adonisjs/core/logger'
interface RecordPayload {
  name: string
  type: string
  value: string
  priority: number | null
  domainId: number
}

@inject()
export class RecordService {
  // Your code here
  constructor(
    private readonly repository: RecordRepository,
    private readonly ctx: HttpContext,
    private readonly logger: Logger
  ) {}
  private get userId() {
    return this.ctx.auth.user!.id
  }

  checkOwnership(record: RecordSchema) {
    if (record.userId !== this.userId) {
      this.logger.warn(
        `Record access rejected for record: ${record.id} user: ${this.userId}: not the owner`
      )
      throw httpError(403, 'You are not allowed to access this record')
    }
  }

  async createRecord(data: RecordPayload): Promise<Record> {
    this.logger.info(
      `Create record type: ${data.type} name: ${data.name} domain: ${data.domainId} user: ${this.userId}`
    )
    const record = await this.repository.create({ ...data, userId: this.userId })
    return record
  }

  async findRecordById(id: number): Promise<Record | null> {
    this.logger.info(`Find record by id: ${id} user: ${this.userId}`)
    const record = await this.repository.findById(id)
    if (!record) {
      return null
    }
    this.checkOwnership(record)
    return record
  }

  async updateRecord(id: number, data: Partial<RecordPayload>): Promise<Record> {
    this.logger.info(`Update record: ${id} user: ${this.userId}`)
    const record = await this.repository.findById(id)
    if (!record) {
      this.logger.warn(`Record update rejected for record: ${id}: record not found`)
      throw httpError(404, 'Record not found')
    }
    this.checkOwnership(record)
    return this.repository.update(record, data)
  }

  async deleteRecord(id: number): Promise<void> {
    this.logger.info(`Delete record: ${id} user: ${this.userId}`)
    const record = await this.repository.findById(id)
    if (!record) {
      this.logger.warn(`Record delete rejected for record: ${id}: record not found`)
      throw httpError(404, 'Record not found')
    }
    this.checkOwnership(record)
    await this.repository.delete(record)
  }

  async findRecordsByDomainId(domainId: number): Promise<Record[]> {
    this.logger.info(`Find records for domain: ${domainId} user: ${this.userId}`)
    const records = await this.repository.findByDomainId(domainId)
    records.forEach((record) => this.checkOwnership(record))
    return records
  }

  async createManyRecord(data: RecordPayload[]): Promise<Record[]> {
    this.logger.info(
      `Create records: ${data.length} for domain: ${data[0]?.domainId ?? 'none'} user: ${this.userId}`
    )
    const records = await this.repository.createMany(
      data.map((r) => ({
        ...r,
        userId: this.userId,
      }))
    )
    return records
  }

  async deleteRecordsByDomainId(domainId: number): Promise<void> {
    this.logger.info(`Delete records for domain: ${domainId} user: ${this.userId}`)
    await this.repository.deleteByDomainId(domainId)
  }
}
