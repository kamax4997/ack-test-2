import Model from './_model'
import schema from './_schema'
import modelName from './_name'
import { setOverrides } from '../../../../src/datasources/db/_utils'

export default db =>
  ['strong', 'soft', 'weak', 'dirty'].reduce(
    (obj, type) => ({
      ...obj,
      [`${modelName}_${type}`]: Model({
        modelName,
        type,
        db,
        setOverrides,
        schema,
      }),
    }),
    {},
  )
