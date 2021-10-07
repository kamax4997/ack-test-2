import Model from './_model'
import schema from './_schema'
import modelName from './_name'
import { setOverrides } from '../../../../src/datasources/db/_utils'

export default db =>
  new Model({
    [modelName]: db.model(modelName, setOverrides(schema)),
  })
