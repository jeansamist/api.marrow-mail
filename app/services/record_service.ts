import { RecordSchema } from '#database/schema'
import Record from '#models/record'
import RecordRepository from '#repositories/record_repository'
import { httpError } from '#utils/http_error'
import { inject } from '@adonisjs/core'
import { HttpContext } from '@adonisjs/core/http'
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
    private readonly ctx: HttpContext
  ) {}
  private get userId() {
    return this.ctx.auth.user!.id
  }

  checkOwnership(record: RecordSchema) {
    if (record.userId !== this.userId) {
      throw httpError(403, 'You are not allowed to access this record')
    }
  }

  async createRecord(data: RecordPayload): Promise<Record> {
    const record = await this.repository.create({ ...data, userId: this.userId })
    return record
  }

  async findRecordById(id: number): Promise<Record | null> {
    const record = await this.repository.findById(id)
    if (!record) {
      return null
    }
    this.checkOwnership(record)
    return record
  }

  async updateRecord(id: number, data: Partial<RecordPayload>): Promise<Record> {
    const record = await this.repository.findById(id)
    if (!record) {
      throw httpError(404, 'Record not found')
    }
    this.checkOwnership(record)
    return this.repository.update(record, data)
  }

  async deleteRecord(id: number): Promise<void> {
    const record = await this.repository.findById(id)
    if (!record) {
      throw httpError(404, 'Record not found')
    }
    this.checkOwnership(record)
    await this.repository.delete(record)
  }

  async findRecordsByDomainId(domainId: number): Promise<Record[]> {
    const records = await this.repository.findByDomainId(domainId)
    records.forEach((record) => this.checkOwnership(record))
    return records
  }

  async createManyRecord(data: RecordPayload[]): Promise<Record[]> {
    const records = await this.repository.createMany(
      data.map((r) => ({
        ...r,
        userId: this.userId,
      }))
    )
    return records
  }
}
