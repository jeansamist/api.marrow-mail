import type Record from '#models/record'
import { BaseTransformer } from '@adonisjs/core/transformers'

export default class RecordTransformer extends BaseTransformer<Record> {
  toObject() {
    return this.pick(this.resource, ['id', 'name', 'type', 'value', 'priority'])
  }
}
