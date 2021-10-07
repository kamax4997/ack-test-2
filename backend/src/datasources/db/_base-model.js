import mongoose from 'mongoose'
import { MongoDataSource } from 'apollo-datasource-mongo'
import useSearchParams from 'mongo-search-parameters'
import { isProduction } from '~/environment'
import { throwIfError } from '../../utils'
import { useModifiers } from './_utils'

const simpleMethods = [
  'getOneDeleted',
  'getOneWithDeleted',
  'getManyDeleted',
  'getManyWithDeleted',
]

export class BaseModelDataSource extends MongoDataSource {
  initialize(config) {
    super.initialize({
      ...config,
      debug: !isProduction,
    })
  }

  // READS

  // DATALOADERS

  loadOne(docId) {
    return this[this.model].loadOneById(docId)
  }

  async loadMany(UsersIds) {
    const items = await this[this.model].loadManyByIds(UsersIds)
    return items.filter(item => !!item)
  }

  async loadManyByQuery(query) {
    const docs = await this[this.model].loadManyByQuery(query)
    return docs
  }

  // BASIC QUERIES WITH MODIFIERS

  getById(docId, modifiers) {
    return useModifiers(this[this.model].findById(docId))(modifiers)
  }

  getOne(params, modifiers) {
    return useModifiers(this[this.model].findOne(params))(modifiers)
  }

  // BASIC QUERY WITH MODIFIERS AND SEARCH PARAMETES (i.e { where: MJSON })

  getMany(params, modifiers) {
    return useModifiers(useSearchParams(this[this.model], { ...params }))(
      modifiers,
    )
  }

  // SOFT DELETE RELATED QUERIES - NO MODIFIERS, NO SEARCH PARAMETERS
  getOneDeleted(params, modifiers) {
    if (modifiers)
      throwIfError('modifiers are not allowed for:', simpleMethods.join(', '))
    return this[this.model].findOneDeleted(params)
  }
  getOneWithDeleted(params, modifiers) {
    if (modifiers)
      throwIfError('modifiers are not allowed for:', simpleMethods.join(', '))
    return this[this.model].findOneWithDeleted(params)
  }

  async getManyDeleted(params, modifiers) {
    if (modifiers)
      throwIfError('modifiers are not allowed for:', simpleMethods.join(', '))
    return this[this.model].findDeleted(params)
  }
  async getManyWithDeleted(params, modifiers) {
    if (modifiers)
      throwIfError('modifiers are not allowed for:', simpleMethods.join(', '))
    return this[this.model].findWithDeleted(params)
  }

  // WRITES

  async save(data, conditions = {}) {
    const { _id = mongoose.Types.ObjectId(), ...doc } = data
    const opts = {
      overwrite: true,
      runValidators: true,
      setDefaultsOnInsert: true,
      upsert: true,
      new: true,
      context: 'query',
    }
    const item = await this[this.model].findOneAndUpdate(
      { _id, ...conditions },
      doc,
      opts,
    )
    return item
  }

  async deleteById(id) {
    const deletedItem = await this[this.model].findByIdAndDelete(id)
    return deletedItem
  }
}
