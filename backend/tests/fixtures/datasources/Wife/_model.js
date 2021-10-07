import { BaseModelDataSource } from '../../../../src/datasources/db/_base-model'

export default ({ modelName, type, db, setOverrides, schema }) => {
  const model = `${modelName}_${type}`
  const Model = class extends BaseModelDataSource {
    constructor(args) {
      super(args)
      super.model = model
    }
  }
  return new Model({
    [`${modelName}_${type}`]: db.model(
      `${modelName}_${type}`,
      setOverrides(schema),
    ),
  })
}
