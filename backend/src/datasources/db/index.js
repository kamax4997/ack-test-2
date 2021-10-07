import { isTesting, useExperimentalConnection } from '~/environment'
import buildRelationships from './Relationship/_build-relationships'
import sources from '../../dataconnectors/db/_db-sources'

export { UserHelper } from './User'

export const dbSource = async db => {
  if (isTesting)
    // eslint-disable-next-line global-require
    return require('../../../tests/fixtures/datasources').dbSource(db)

  const dataSources = Object.entries(sources).reduce((obj, [key, value]) => {
    const connection = useExperimentalConnection ? db[key] : db
    return {
      ...obj,
      [key]: value(connection),
    }
  }, {})

  const relationshipDbConnection = useExperimentalConnection
    ? db.Relationship
    : db
  const Relationship = await buildRelationships(relationshipDbConnection)
  return {
    ...dataSources,
    Relationship,
  }
}
