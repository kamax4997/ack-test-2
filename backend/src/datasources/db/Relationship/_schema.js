import mongoose from 'mongoose'
import * as yup from 'yup'
import { isTesting } from '~/environment'
import sources from '~/dataconnectors/db/_db-sources'

let sourcesNames = Object.keys(sources)

if (isTesting) {
  // eslint-disable-next-line global-require
  const testingSources = require('../../../../tests/fixtures/datasources')
    .sourcesNames
  sourcesNames = [...sourcesNames, ...testingSources]
}

export default () => {
  const schema = mongoose.Schema(
    {},
    { timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' } },
  )
  return schema
}

const ALLOWED_DELETION_ROOT = {
  STRONG: 'strong',
  SOFT: 'soft',
}

const ALLOWED_DELETION_TIE = {
  ...ALLOWED_DELETION_ROOT,
  WEAK: 'weak',
  DIRTY: 'dirty',
}

const allowedEntities = [...sourcesNames]

const relationshipSchemaForeignKeyObj = yup.object().shape({
  entity: yup
    .string()
    .required('An entitiy is required')
    .test(
      'must-be-one-of-parents',
      // eslint-disable-next-line
    '${path} must match one of parents',
      (value, context) => {
        const parents = context.from
          .slice(1, context.from.length)
          .map(parent => parent.value.entity)
        return parents.includes(value)
      },
    ),
  isArray: yup.bool().default(false),
  isParentEntityId: yup.bool().required(),
})

const relationshipSchemaTieObj = yup.object().shape({
  entity: yup
    .string()
    .required('An entity is required')
    .oneOf(allowedEntities)
    .test(
      'is-not-parent',
      // eslint-disable-next-line
      '${path} cannot be same as parent | ${value}',
      (value, context) => {
        return value !== context.from[1].value.entity
      },
    ),
  connection: yup
    .string()
    .required()
    .oneOf(Object.values(ALLOWED_DELETION_TIE)),
  foreignKeys: yup
    .array()
    .required('"foreignKeys" field is required')
    .of(relationshipSchemaForeignKeyObj),
})

const relationshipSchemaObj = yup.object().shape({
  entity: yup
    .string()
    .required('An entity is required')
    .oneOf(allowedEntities),
  deletion: yup
    .string()
    .default(ALLOWED_DELETION_ROOT.STRONG)
    .oneOf(Object.values(ALLOWED_DELETION_ROOT)),
  ties: yup
    .array()
    .required('"ties" field is missing')
    .of(relationshipSchemaTieObj),
})

export const relationshipSchema = yup.array().of(relationshipSchemaObj)
