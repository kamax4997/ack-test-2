export const queryTypes = `
  type Query {
    ping: String
    expensiveQuery: String @cost (complexity: 10000)
    connection: String!
    _checkAuth: String
  }
`

export const queryResolvers = {
  Query: {
    ping: () => 'Server is up and running... working smoothly',
    connection: () => 'Connected',
    _checkAuth: (_, args, context) => {
      return `Authorized | CurentUserId ${context.user.id}!`
    },
  },
}
