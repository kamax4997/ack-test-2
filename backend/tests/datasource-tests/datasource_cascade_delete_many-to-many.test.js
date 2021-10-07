import { tester } from 'graphql-tester-options'
import decode from 'jwt-decode'
import { SERVER } from '../../src/config'
import ROLES_PERMISSIONS from '../../../settings/roles-permissions.json'
import { deepFlatten } from '../../src/utils'
import { deletionChecks } from './_utils'

const wait = ms => {
  const start = new Date().getTime()
  let end = start
  while (end < start + ms) {
    end = new Date().getTime()
  }
}
const { PORT, GRAPHQL, PROTOCOL, HOST } = SERVER

const loginQuery = `
mutation login ($userCredentials: userCredentials!) {
  login(input: $userCredentials)
}`

const testCascadeDeleteResourcesSingleMutation = `
  mutation testCascadeDeleteResourcesSingle($input: MJSON!) {
    testCascadeDeleteResourcesSingle(input: $input)
  }
`

const testGetDataQuery = `
  query testGetData {
    testGetData
  }
`

let sharedToken
let sharedRefreshToken
let currentUserId
let users
let companies

let initialData = {}
describe('A user', function() {
  beforeAll(() => {
    this.test = tester({
      url: `${PROTOCOL}://${HOST}:${PORT}${GRAPHQL}`,
      contentType: 'application/json',
    })
  })
  afterAll(async () => {
    await new Promise(resolve => setTimeout(resolve, 100)) // --forceExit swallow console.log | Ref: https://stackoverflow.com/a/41094010/5546463
  })
  it('should login with right credentials and full rights', done => {
    this.test(
      JSON.stringify({
        query: loginQuery,
        variables: {
          userCredentials: {
            username: 'rico',
            password: 'MTIzNDU2', // 'this 123456' encoded (base64). It'll be '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92' hashed
          },
        },
      }),
      { jar: true },
    )
      .then(res => {
        expect(res.status).toBe(200)
        expect(res.success).toBe(true)
        const { data: { login = null } = {} } = res
        expect(typeof login).toBe('string')
        const tokens = login.includes('token') && login.includes('refreshToken')
        expect(tokens).toBe(true)
        const { token, refreshToken } = JSON.parse(login)
        sharedToken = token
        sharedRefreshToken = refreshToken
        const decodedToken = decode(token)
        const { user: { roles, permissions, id } = {} } = decodedToken
        currentUserId = id
        expect(Array.isArray(permissions)).toBe(true)
        expect(Array.isArray(roles)).toBe(true)
        expect(roles).toHaveLength(
          deepFlatten(ROLES_PERMISSIONS.USERS).reduce((count, user) => {
            if (Array.isArray(user)) return count + user.length
            return count + 1
          }, 0),
        )
        const rightRoles = roles.includes('ADMIN') && roles.includes('USER')
        expect(rightRoles).toBe(true)
        done()
      })
      .catch(err => {
        expect(err).toBe(null)
        done()
      })
  })
  it('should be allowed to retrieve all users', done => {
    this.test(
      JSON.stringify({
        query: testGetDataQuery,
      }),
      {
        jar: true,
        headers: {
          'Content-Type': 'application/json',
          'x-connector-auth-request-type': 'LOCAL_STORAGE',
          'x-connector-token': sharedToken,
          'x-connector-refresh-token': sharedRefreshToken,
        },
      },
    )
      .then(res => {
        expect(res.status).toBe(200)
        expect(res.success).toBe(true)
        expect(!!res.data.testGetData).toBe(true)
        initialData = res.data.testGetData
        users = initialData.users
        companies = users.map(user => user.company).filter(v => !!v)
        done()
      })
      .catch(err => {
        expect(err).toBe(null)
        done()
      })
  })

  // MANY TO MANY SOFT/WEAK | FAMILY(SOFT) => MEMBER(WEAK)
  it('should be allowed to delete the family from the family array of the member if the family is soft deleted', done => {
    const familyId = initialData.families.find(
      family => family.name === 'Gates Stock',
    )._id
    this.test(
      JSON.stringify({
        query: testCascadeDeleteResourcesSingleMutation,
        variables: {
          input: {
            entity: 'Family',
            id: familyId,
            deletion: 'soft',
          },
        },
      }),
      {
        jar: true,
        headers: {
          'Content-Type': 'application/json',
          'x-connector-auth-request-type': 'LOCAL_STORAGE',
          'x-connector-token': sharedToken,
          'x-connector-refresh-token': sharedRefreshToken,
        },
      },
    )
      .then(res => {
        // console.log(JSON.stringify(res.data.testCascadeDeleteResourcesSingle, null, 2));
        expect(res.status).toBe(200)
        expect(res.success).toBe(true)
        expect(!!res.data.testCascadeDeleteResourcesSingle).toBe(true)
        expect(res.data.testCascadeDeleteResourcesSingle.length > 0).toBe(true)
        expect(!!res.data.testCascadeDeleteResourcesSingle).toBe(true)
        const {
          data: { testCascadeDeleteResourcesSingle: data },
        } = res
        data.forEach(function(item) {
          if (item.collection === 'Member' && item.deletion === 'weak') {
            expect(item.ids.length > 0).toBe(true)
            expect(item.entityIdFields.length > 0).toBe(true)
            expect(!!item.entityIdFields.find(item => item.weakIds.includes(familyId))).toBe(true)
          }
          if (item.collection === 'Family' && item.deletion === 'soft') {
            expect(item.ids.length > 0).toBe(true)
          }
          const deletedItems = Object.values(item.items).reduce(
            (arr, array) => {
              return [
                ...arr,
                {
                  deletedItem: array.reduce((o, i) => ({ ...o, ...i }), {}),
                },
              ]
            },
            [],
          )
          deletedItems.forEach(function(object) {
            const { deletedItem = {} } = object || {}
            if (Object.keys(deletedItem).length > 0)
              expect(
                deletionChecks({
                  deletedItem,
                  collection: item.collection,
                  entityIdFields: item.entityIdFields,
                  deletion: item.deletion,
                }),
              ).toBe(true)
          })
        })
        done()
      })
      .catch(err => {
        expect(err).toBe(null)
        done()
      })
  })

  // MANY TO MANY SOFT/WEAK | USER(SOFT) => COURSE(WEAK)
  it('should be allowed to remove user from course when user is deleted', done => {
    const currentUserId = users.filter(user => user.username === 'veronica')[0]._id
    this.test(
      JSON.stringify({
        query: testCascadeDeleteResourcesSingleMutation,
        variables: {
          input: {
            entity: 'User',
            id: currentUserId,
          },
        },
      }),
      {
        jar: true,
        headers: {
          'Content-Type': 'application/json',
          'x-connector-auth-request-type': 'LOCAL_STORAGE',
          'x-connector-token': sharedToken,
          'x-connector-refresh-token': sharedRefreshToken,
        },
      },
    )
      .then(res => {
        // console.log(JSON.stringify(res.data.testCascadeDeleteResourcesSingle, null, 2));
        expect(res.status).toBe(200)
        expect(res.success).toBe(true)
        expect(!!res.data.testCascadeDeleteResourcesSingle).toBe(true)
        expect(res.data.testCascadeDeleteResourcesSingle.length > 0).toBe(true)
        expect(!!res.data.testCascadeDeleteResourcesSingle).toBe(true)
        const {
          data: { testCascadeDeleteResourcesSingle: data },
        } = res
        data.forEach(function(item) {
          // console.log(currentUserId, typeof currentUserId, JSON.stringify(item, null, 2));
          if (item.collection === 'Course' && item.deletion === 'weak') {
            expect(item.ids.length > 0).toBe(true)
            expect(item.entityIdFields.length > 0).toBe(true)
            expect(!!item.entityIdFields.find(item => item.weakIds.includes(currentUserId))).toBe(true)
          }
          if (item.collection === 'User' && item.deletion === 'soft') {
            expect(item.ids.length > 0).toBe(true)
            expect(item.ids.includes(currentUserId)).toBe(true)
          }
          const deletedItems = Object.values(item.items).reduce(
            (arr, array) => {
              return [
                ...arr,
                {
                  deletedItem: array.reduce((o, i) => ({ ...o, ...i }), {}),
                },
              ]
            },
            [],
          )
          deletedItems.forEach(function(object) {
            const { deletedItem = {} } = object || {}
            if (Object.keys(deletedItem).length > 0)
              expect(
                deletionChecks({
                  deletedItem,
                  collection: item.collection,
                  entityIdFields: item.entityIdFields,
                  deletion: item.deletion,
                }),
              ).toBe(true)
          })
        })
        done()
      })
      .catch(err => {
        expect(err).toBe(null)
        done()
      })
  })
})
