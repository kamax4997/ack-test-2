// import useSearchParams from 'mongo-search-parameters'
import { db } from '~/dataconnectors'
import { encryptor } from '~/utils/'
import { ERROR, useExperimentalConnection } from '~/environment'
// import { useModifiers } from '../_utils'
import model from './_name'
import { BaseModelDataSource } from '../_base-model'

export class User extends BaseModelDataSource {
  constructor(args) {
    super(args)
    super.model = model
  }
}

// TODO: add
export const UserHelper = {
  validate: async (username, password) => {
    const connection = useExperimentalConnection ? db.User : db
    const validUser = await connection.models.User.findOne({ username }).lean()
    if (validUser) {
      const validPassword = await encryptor.verify(
        { digest: password },
        validUser.password,
      )
      if (!validPassword) {
        throw new Error(ERROR.USER.WRONG_PASSWORD)
      }
      return validUser
    }
    throw new Error(ERROR.USER.WRONG_CREDENTIALS)
  },

  getPassword: async ({ id, delta = false }) => {
    const connection = useExperimentalConnection ? db.User : db
    const validUser = await connection.models.User.findById(id)
    if (validUser) {
      const response = {
        password: validUser.password,
        ...(delta && { delta: validUser.delta }),
      }
      return response
    }
    throw new Error(ERROR.USER.DOES_NOT_EXIST)
  },
}
