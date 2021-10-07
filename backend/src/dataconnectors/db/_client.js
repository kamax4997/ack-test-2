import mongoose from 'mongoose'
import { isTesting, useExperimentalConnection } from '~/environment'
import sources from './_db-sources'

const modelNames = [...Object.keys(sources), 'Relationship']

const mongoUri = process.env.DB_CONNECTION_STRING

const connections = modelNames.reduce(
  (obj, name) => ({
    ...obj,
    [name]: null,
  }),
  { default: null },
)

const poolSize = process.env.MONGO_POOL_SIZE || 5

const connectionOptions = {
  // autoReconnect: true,
  // reconnectTries: 1000000,
  // reconnectInterval: 3000,
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useCreateIndex: true,
  useFindAndModify: false,
  poolSize,
}

const connectionFn = (uri, name) => {
  connections[name] = mongoose.createConnection(uri, connectionOptions)
}

const initiMongoose = async (uri = mongoUri, name = 'default') => {
  connectionFn(uri, name)

  mongoose.pluralize(null)
  connections[name].on('connected', () => {
    console.log('[MONGO][INFO]: ', name, 'Connection Established')
    console.log('[MONGO][INFO]: ', name, 'Connected to db')
  })

  connections[name].on('reconnected', () => {
    console.log('[MONGO][INFO]: ', name, 'Connection Reestablished')
  })

  connections[name].on('disconnected', () => {
    console.log('[MONGO][WARNING]: ', name, 'Connection Disconnected')
  })

  connections[name].on('close', () => {
    console.log('[MONGO][INFO]: ', name, 'Connection Closed')
  })

  connections[name].on('error', error => {
    console.log(`[MONGO][ERROR]: ${name} | ERROR: ${error}`)
  })
}
if (isTesting) {
  ;(async () => {
    const { MongoMemoryServer } = require('mongodb-memory-server-core'); // eslint-disable-line
    mongoose.Promise = Promise
    const mongoServer = new MongoMemoryServer({
      binary: {
        version: '4.0.3',
        downloadDir: '../../../../tests/mongo-bin',
      },
    })
    const uri = await mongoServer.getUri()
    await mongoose.connect(uri, connectionOptions)
  })()
} else if (useExperimentalConnection) {
  modelNames.forEach(function createConnection(name) {
    initiMongoose(mongoUri, name)
  })
} else initiMongoose()

const numberOfConnections = useExperimentalConnection ? modelNames.length : 1
console.log('[MONGO][INFO]: CONNECTIONS USED', numberOfConnections)
console.log('[MONGO][INFO]: POOL SIZE PER CONNECTION', poolSize)
/* eslint-disable no-nested-ternary */
export default isTesting
  ? mongoose
  : useExperimentalConnection
  ? connections
  : connections.default
