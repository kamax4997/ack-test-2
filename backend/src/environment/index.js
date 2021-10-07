import mongoSettings from '$/settings/mongo'

export const isTesting =
  process.env.NODE_ENV && process.env.NODE_ENV === 'testing'

export const isProduction =
  process.env.NODE_ENV && process.env.NODE_ENV === 'production'

export const isDevelopment =
  process.env.NODE_ENV === 'development' || (!isTesting && !isProduction)

export const useExperimentalConnection =
  !isTesting && mongoSettings?.connection?.experimental

export { RESPONSE, PRIVATE_PREFIX } from './_enums'
export { startupMessages } from './_startup-messages'
export { ERROR } from './_errors'
export { UNAUTHORIZED, FORBIDDEN, NOT_ALLOWED } from './_authorization'
