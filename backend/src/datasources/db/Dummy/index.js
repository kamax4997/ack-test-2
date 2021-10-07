import { setOverrides } from '../_utils'
import Model from './_model'
import schema from './_schema'
import name from './_name'

export default db => new Model({ [name]: db.model(name, setOverrides(schema)) })
