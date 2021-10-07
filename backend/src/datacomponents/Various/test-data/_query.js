import { roles, permissions } from '~/directives'
import { throwIfError } from '~/utils'

export const queryTypes = `
  type Query {
    testPermissionsHasRole: String @${roles.is.admin}
    testPermissionsIsAllowed: String @${permissions.can.read.user_profile}
    testEmailScalar: EmailAddress
    testJSON(where: JSON): Boolean
    testSafeMJSON(where: MJSON): Boolean
    testUnsafeMJSON(where: MJSON): Boolean
    _testCheckAuthAdmin: String @${roles.is.admin}
    testConstraint(input: inputConstraint): String
    testGetUsers: [TestUser] @${roles.is.admin}
    testGetData: JSON @${roles.is.admin}
  }
`

// NOTE:
// Keep in mind  that "_checkAuth: String!  @${roles.is.admin}" if not allowed would also throw
// TypeError: Cannot convert undefined or null to object
// when using non nullable objects

const IsJsonString = str => {
  try {
    JSON.parse(str)
  } catch (e) {
    throwIfError(e)
  }
  return true
}

export const queryResolvers = {
  Query: {
    _testCheckAuthAdmin: (_, args, context) =>
      `Authorized | CurentUserId ${context.user.id}!`,
    testPermissionsHasRole: () => 'ok role',
    testPermissionsIsAllowed: () => 'ok permission',
    testEmailScalar: () => 'info@test.com',
    testJSON: (_, { where }) => IsJsonString(JSON.stringify(where)),
    testSafeMJSON: (_, { where }) => IsJsonString(JSON.stringify(where)),
    testUnsafeMJSON: (_, { where }) => IsJsonString(JSON.stringify(where)),
    testConstraint: () => 'ok',
    testGetUsers: async (_, __, { dataSources }) => {
      const users = await dataSources.User.getMany({})
      const companies = await dataSources.Company.getMany({})
      return users.map(user => ({
        ...user,
        company: companies.find(
          company => company.owner?.toString() === user._id?.toString(),
        ),
      }))
    },
    testGetData: async (_, __, { dataSources }) => {
      return {
        users: await dataSources.User.getMany({}),
        companies: await dataSources.Company.getMany({}),
        partners: await dataSources.Partner.getMany({}),
        messages: await dataSources.Message.getMany({}),
        resources: await dataSources.Resource.getMany({}),
        courses: await dataSources.Course.getMany({}),
        families: await dataSources.Family.getMany({}),
        members: await dataSources.Member.getMany({}),
        husbands: await ['strong', 'soft', 'weak', 'dirty'].reduce(
          async (obj, type) => ({
            ...(await obj),
            [type]: await dataSources[`Husband_${type}`].getMany({}),
          }),
          {},
        ),
        wifes: await ['strong', 'soft', 'weak', 'dirty'].reduce(
          async (obj, type) => ({
            ...(await obj),
            [type]: await dataSources[`Wife_${type}`].getMany({}),
          }),
          {},
        ),
      }
    },
  },
}
