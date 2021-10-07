import { setOverrides } from '../_utils'
import { User as Model } from './_model'
import schema from './_schema'
import name from './_name'

export const User = db =>
  new Model({ [name]: db.model(name, setOverrides(schema)) })
export { UserHelper } from './_model'
