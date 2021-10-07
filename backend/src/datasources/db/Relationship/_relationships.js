import { isTesting } from '~/environment'

const relationships = []
export default isTesting
  ? require('../../../../tests/fixtures').relationships // eslint-disable-line global-require
  : relationships
