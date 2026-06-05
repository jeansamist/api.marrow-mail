import Record from '#models/record'
import { type ModelProps } from '#utils/generics'
import { type TransactionClientContract } from '@adonisjs/lucid/types/database'
export default class RecordRepository {
  private model = Record
  get getModel(): typeof Record {
    return this.model
  }
  async create(data: ModelProps<Record>, trx?: TransactionClientContract): Promise<Record> {
    const record = new this.model()
    if (trx) {
      record.useTransaction(trx)
    }
    record.fill(data)
    await record.save()
    return record
  }

  async createMany(data: ModelProps<Record>[]) {
    return this.model.createMany(data)
  }
  async findById(id: number): Promise<Record | null> {
    return this.model.find(id)
  }
  async update(
    record: Record,
    data: Partial<ModelProps<Record>>,
    trx?: TransactionClientContract
  ): Promise<Record> {
    if (trx) {
      record.useTransaction(trx)
    }
    return record.merge(data).save()
  }

  async delete(record: Record): Promise<void> {
    await record.delete()
  }

  async findByDomainId(domainId: number): Promise<Record[]> {
    return this.model.findManyBy('domainId', domainId)
  }
}
