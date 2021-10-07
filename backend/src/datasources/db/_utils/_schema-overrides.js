import softDelete from 'mongoose-delete'
import { isDevelopment } from '~/environment'

const filteredKeys = ['$', 'deleted', 'where']
const isNotFilteredKey = c => !filteredKeys.find(key => c.includes(key))
const keyify = (obj, prefix = '') =>
  Object.keys(obj).reduce((res, el) => {
    if (Array.isArray(obj[el])) {
      return res
    } else if (typeof obj[el] === 'object' && obj[el] !== null) {
      return [...res, ...keyify(obj[el], `${prefix + el}.`)]
    }
    return [...res, prefix + el]
  }, [])
export default schema => {
  if (isDevelopment) {
    const schemaFields = Object.keys(schema.obj)
    const indexes = [
      ...schema._indexes
        .flatMap(index => index)
        .filter(
          v =>
            !!v &&
            typeof v === 'object' &&
            !Array.isArray(v) &&
            Object.keys(v).length > 0,
        )
        .flatMap(o => Object.keys(o)),
      ...Object.entries(schema.obj)
        // eslint-disable-next-line no-unused-vars
        .filter(([_, value]) => !!value.index || !!value.unique)
        .map(([k]) => k),
    ]

    ;['find', 'findOne'].forEach(function m(method) {
      schema.pre(method, function pre(next) {
        const conditions = keyify(this._conditions)
          .flatMap(condition => condition.split('.'))
          .filter(c => isNotFilteredKey(c))
        // console.log({ indexes })
        // console.log({ conditions })
        const missingCoverage = [
          ...new Set(
            conditions.filter(
              c => !indexes.find(i => c === i) && schemaFields.includes(c),
            ),
          ),
        ]
        if (missingCoverage.length)
          console.log(
            `[MONGO][PERFS][COLLECTION: ${this._collection.collectionName}][QUERY][COVERAGE]`,
            {
              method,
              missingCoverage,
            },
          )

        next()
      })
    })
  }
  schema.plugin(softDelete, {
    overrideMethods: true,
    deletedBy: true,
    deletedAt: true,
    validateBeforeDelete: false,
    indexFields: true,
  })
  return schema
}
