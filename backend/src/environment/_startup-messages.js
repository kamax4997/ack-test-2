import { AUTH } from '~/config'

const localAuthCheck = () =>
  AUTH.ENDPOINT === 'localhost' ||
  AUTH.ENDPOINT === '127.0.0.1' ||
  AUTH.ENDPOINT === '0.0.0.0'

export const startupMessages = ({
  endpoint = 'http://localhost',
  port,
  graphiql = '/graphql',
  graphql = 'graphql',
}) => {
  if (
    typeof AUTH.SECRET_TOKEN === 'undefined' ||
    typeof AUTH.SECRET_REFRESH_TOKEN === 'undefined'
  ) {
    console.warn(`[WARNING]: NOT ALL ENV SECRETS HAVE BEEN PROVIDED. Check README.md
      for more information`)
  } else {
    console.log('[SERVER][INFO]: AUTH SECRETS HAVE BEEN PROVIDED')
    if (typeof AUTH.ENDPOINT === 'undefined') {
      console.warn(
        '[WARNING]: process.env.AUTH_ENDPOINT is not defined. Check README.md for more information',
      )
    } else {
      console.log(`[SERVER][INFO]: AUTH ENDPOINT = ${AUTH.ENDPOINT}`)
      const authLocation = localAuthCheck() ? 'THIS ONE' : 'EXTERNAL'
      console.log(`[SERVER][INFO]: AUTH SERVER IS ${authLocation}`)
      console.log('[SERVER][INFO]: ALL SET >> SERVER CONFIGURATION READY')
    }
  }
  console.log(
    `[SERVER][INFO]: 🚀  GraphQL Server is now running on ${endpoint}:${port}${graphql} 🚀`,
  )
  console.log(`[SERVER][INFO]: View GraphiQL at ${endpoint}:${port}${graphiql}`)
}
