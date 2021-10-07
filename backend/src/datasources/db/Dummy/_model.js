// import { useModifiers } from '../_utils'
import model from './_name'
import { BaseModelDataSource } from '../_base-model'

class Model extends BaseModelDataSource {
  constructor(args) {
    super(args)
    super.model = model
  }
}

export default Model
