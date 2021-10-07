import { tester } from 'graphql-tester-options'
import decode from 'jwt-decode'
import { SERVER } from '../../src/config'
import ROLES_PERMISSIONS from '../../../settings/roles-permissions.json'
import { deepFlatten } from '../../src/utils'
import { deletionChecks } from './_utils'

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

const testGetUsersQuery = `
  query testGetUsers {
    testGetUsers {
      _id
      username
      company
    }
  }
`

let sharedToken
let sharedRefreshToken
let currentUserId
let users
let companies

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
        query: testGetUsersQuery,
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
        expect(!!res.data.testGetUsers).toBe(true)
        users = res.data.testGetUsers
        companies = users.map(user => user.company).filter(v => !!v)
        done()
      })
      .catch(err => {
        expect(err).toBe(null)
        done()
      })
  })
  // ONE TO MANY SOFT DELETE
  it('should be allowed to cascade delete one resource of deleted user', done => {
    this.test(
      JSON.stringify({
        query: testCascadeDeleteResourcesSingleMutation,
        variables: {
          input: {
            entity: 'User',
            id: users.filter(user => user.username === 'iris')[0]._id,
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
        const {
          data: { testCascadeDeleteResourcesSingle: data },
        } = res
        data.forEach(function(item) {
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

  // ONE TO ONE MIXED (STRONG/SOFT) DELETE
  it('should be allowed to cascade delete one owner of the deleted company', done => {
    this.test(
      JSON.stringify({
        query: testCascadeDeleteResourcesSingleMutation,
        variables: {
          input: {
            entity: 'Company',
            id: companies.find(
              company =>
                company.owner?.toString() ===
                users.find(user => user.username === 'jill')._id?.toString(),
            )._id,
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

  // // ONE TO MANY WEAK DELETE TEST
  // it('should be allowed to remove reference in messages when user owner is deleted', (done) => {
  //   this
  //     .test(
  //       JSON.stringify({
  //         query: testCascadeDeleteResourcesSingleMutation,
  //         variables: {
  //           input: { entity: 'User', id: users.filter(user => user.username === 'matt')[0]._id }
  //         },
  //       }),
  //       {
  //         jar: true,
  //         headers: {
  //           'Content-Type': 'application/json', 'x-connector-auth-request-type': 'LOCAL_STORAGE', 'x-connector-token': sharedToken, 'x-connector-refresh-token': sharedRefreshToken,
  //         },
  //       },
  //     )
  //     .then((res) => {
  //       // console.log(JSON.stringify(res.data.testCascadeDeleteResourcesSingle, null, 2));
  //       expect(res.status).toBe(200);
  //       expect(res.success).toBe(true);
  //       expect(!!res.data.testCascadeDeleteResourcesSingle).toBe(true);
  //       expect(res.data.testCascadeDeleteResourcesSingle.length > 0).toBe(true);
  //       expect(!!res.data.testCascadeDeleteResourcesSingle).toBe(true);
  //       const { data: { testCascadeDeleteResourcesSingle: data } } = res
  //       data.forEach(function(item) {
  //         const deletedItems = Object.values(item.items).reduce((arr, array) => {
  //           return [
  //             ...arr,
  //             {
  //               deletedItem: array.reduce((o, i) => ({ ...o, ...i }), {})
  //             }
  //           ]
  //         }, [])
  //         deletedItems.forEach(function(object) {
  //           const { deletedItem = {} } = object || {}
  //           if (Object.keys(deletedItem).length > 0) expect(deletionChecks({ deletedItem, collection: item.collection, entityIdFields: item.entityIdFields, deletion: item.deletion })).toBe(true)
  //         });
  //       })
  //       done();
  //     })
  //     .catch((err) => {
  //       expect(err).toBe(null);
  //       done();
  //     });
  // });

  // ONE TO ONE STRONG DELETE TEST | USER
  it('should be allowed to remove partner doc when user is deleted', done => {
    this.test(
      JSON.stringify({
        query: testCascadeDeleteResourcesSingleMutation,
        variables: {
          input: {
            entity: 'User',
            id: users.filter(user => user.username === 'meg')[0]._id,
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
        // console.log(users.filter(user => user.username === 'meg')[0]);
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
  // ONE TO ONE STRONG DELETE TEST | PARTNER
  it('should be allowed to remove user doc when corresponding partner is deleted', done => {
    this.test(
      JSON.stringify({
        query: testCascadeDeleteResourcesSingleMutation,
        variables: {
          input: {
            entity: 'Partner',
            id: users.filter(user => user.username === 'wes')[0]._id,
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

  // Pass multiple ids to the same entity
  it('should be allowed to remove more than one user doc id is array', done => {
    const currentUserIds = users.filter(user => user.username.includes('multi')).map(us => us._id)
    this.test(
      JSON.stringify({
        query: testCascadeDeleteResourcesSingleMutation,
        variables: {
          input: {
            entity: 'User',
            id: currentUserIds,
            deletion: 'strong'
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
          if (item.collection === 'User' && item.deletion === 'strong') {
            expect(item.ids.length === 2).toBe(true)
            expect(item.ids.every(id => currentUserIds.includes(id))).toBe(true)
          }
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

  // Pass multiple entities at once
  it('should be allowed to remove more than one Entity docs if input multi is true is is array', done => {
    currentUserId = users.find(user => user.username === 'fred')._id
    this.test(
      JSON.stringify({
        query: testCascadeDeleteResourcesSingleMutation,
        variables: {
          input: {
            multi: true,
            data: [
              {
                entity: 'User',
                id: currentUserId,
              },
              {
                entity: 'Company',
                id: companies.find(
                  company =>
                    company.owner?.toString() ===
                    users.find(user => user.username === 'fred')._id?.toString(),
                )._id,
                deletion: 'strong'
              },
            ]
          }
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
          // console.log(JSON.stringify(item, null, 2));
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
          if (item.collection === 'User' && item.deletion === 'soft') {
            expect(item.ids.length > 0).toBe(true)
            expect(item.ids.every(id => currentUserId.includes(id))).toBe(true)
          }
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
