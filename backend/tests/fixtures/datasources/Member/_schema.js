import mongoose from 'mongoose'
import uniqueValidator from 'mongoose-unique-validator'

import enums from './_enums' // eslint-disable-line no-unused-vars

const schema = mongoose.Schema(
  {
    families: [mongoose.ObjectId],
    name: {
      type: String,
      index: {
        unique: true,
        partialFilterExpression: {
          deleted: { $eq: false },
        },
      },
    },
  },
  { timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' } },
)

schema.plugin(uniqueValidator)
export default schema
