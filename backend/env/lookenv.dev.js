module.exports = {
  AWS_ACCESS_KEY_ID: {
    default: '',
  },
  AWS_SECRET_ACCESS_KEY: {
    default: '',
  },
  DB_CONNECTION_STRING: {
    default: 'mongodb://localhost:27017/ack-test-2',
  },
  AUTH_SECRET_TOKEN: {
    default: '1234',
  },
  AUTH_SECRET_REFRESH_TOKEN: {
    default: '123456789',
  },
  MONGO_POOL_SIZE: {
    default: 5,
  },
  AUTH_ENDPOINT: 'localhost',
}
