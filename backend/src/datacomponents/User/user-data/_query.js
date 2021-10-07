const wait = ms => {
  const start = new Date().getTime()
  let end = start
  while (end < start + ms) {
    end = new Date().getTime()
  }
}

export const queryTypes = `
  type Query {
    currentUser(delay: Int): User
    users: [User]
  }`
export const queryResolvers = {
  Query: {
    currentUser: async (
      _,
      { delay = 0 },
      { user: contextUser, dataSources: { User } },
    ) => {
      const user = await User.getById(contextUser?.id)
      if (delay) {
        wait(delay)
      }
      return user
    },
    users: (_, __, { dataSources: { User } }) => User.getMany(),
  },
}
