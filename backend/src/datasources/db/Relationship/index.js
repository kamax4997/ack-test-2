import Model from './_model'
import Schema from './_schema'
import modelName from './_name'

export default (db, modelNames) =>
  new Model({
    [modelName]: db.model(modelName, Schema(modelNames)),
  })
