import { User } from '../../../src/datasources/db/User'
import buildRelationships from '../../../src/datasources/db/Relationship/_build-relationships'
import Resource from './Resource'
import Company from './Company'
import Message from './Message'
import Course from './Course'
import Partner from './Partner'
import Husband from './Husband'
import Wife from './Wife'
import Family from './Family'
import Member from './Member'

const sources = {
  User,
  Resource,
  Company,
  Message,
  Course,
  Partner,
  Family,
  Member,
  Husband,
  Wife,
}

export const dbSource = async db => {
  const dataSources = Object.entries(sources).reduce((obj, [key, value]) => {
    const object = ['Husband', 'Wife'].includes(key)
      ? { ...value(db) }
      : { [key]: value(db) }
    return {
      ...obj,
      ...object,
    }
  }, {})
  const modelNames = Object.keys(db.models)
  const Relationship = await buildRelationships(db, modelNames)
  return {
    ...dataSources,
    Relationship,
  }
}

export const sourcesNames = [
  ...Object.keys(sources),
  ...['strong', 'soft', 'weak', 'dirty'].reduce(
    (arr, type) => [
      ...arr,
      ...['Husband', 'Wife'].reduce((a, v) => [...a, `${v}_${type}`], []),
    ],
    [],
  ),
]
