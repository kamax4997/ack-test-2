import SCOPES from '~/config/_scopes'
import { permissions } from '../../../directives'

const { ROLES = {} } = SCOPES || {}
const roles = Object.keys(ROLES)

export const types = `
  enum enumRoles {
    ${roles.join(' ')}
  }

  type User {
    _id: ID!
    name: String
    username: String
    role: enumRoles
    email: String @${permissions.can.read.user_profile}
  }`

export const typeResolvers = {
  //
}
