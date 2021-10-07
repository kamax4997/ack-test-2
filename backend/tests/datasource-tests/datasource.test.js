import { tester } from 'graphql-tester-options'
import { SERVER } from '../../src/config'
import ROLES_PERMISSIONS from '../../src/config/_roles-permissions'

const { PORT, GRAPHQL, PROTOCOL, HOST } = SERVER

const UserAndRoleQuery = `
  query userAndRole {
    users {
      name
      role
    }
  }
`

// USERS
describe('A user', function() {
  beforeAll(() => {
    this.test = tester({
      url: `${PROTOCOL}://${HOST}:${PORT}${GRAPHQL}`,
      contentType: 'application/json',
    })
  })
  it('should retrieve users with roles', done => {
    this.test(
      JSON.stringify({
        query: UserAndRoleQuery,
      }),
      { jar: true },
    )
      .then(res => {
        expect(res.status).toBe(200)
        expect(res.success).toBe(true)
        const {
          data: { users: resUsers },
        } = res
        const users = resUsers.reduce(
          (obj, user) => ({
            ...obj,
            [user.name]: {
              ...user,
            },
          }),
          {},
        )
        console.log(ROLES_PERMISSIONS, 'RESPONSE USERS:', resUsers)
        expect(users.Enrico.role).toBe(ROLES_PERMISSIONS.ADMIN.SPEC.VALUE)
        expect(users.George.role).toBe(ROLES_PERMISSIONS.USER.SPEC.VALUE)
        const allPermissions = Object.entries(ROLES_PERMISSIONS)
          .filter(([role]) => role !== 'OWNER')
          .reduce(
            (arr, [key, value]) => [
              ...arr,
              ...Object.entries(value.PERMISSIONS).reduce(
                (a, [k, v]) => [...a, ...v.map(i => `${k}_${i}`)],
                [],
              ),
            ],
            [],
          )
        done()
      })
      .catch(err => {
        expect(err).toBe(null)
        done()
      })
  })
})
