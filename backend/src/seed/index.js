import { mockUsers } from '~/mocks'
import { isTesting, useExperimentalConnection } from '~/environment'

export const feedDb = async db => {
  const connection = useExperimentalConnection ? db.User : db
  if (!isTesting) {
    const mockedUsers = [...mockUsers]
    await mockedUsers.forEach(async function upsertDefaultUsers(user) {
      // eslint-disable-next-line no-param-reassign
      delete user.id
      await connection.models.User.findOneAndUpdate(
        {
          username: user.username,
        },
        {
          ...user,
        },
        { upsert: true, new: true },
      )
    })
  } else {
    await require('../../tests/utils').seed(db) // eslint-disable-line global-require
  }
}
