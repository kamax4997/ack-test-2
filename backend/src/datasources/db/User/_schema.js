import mongoose from 'mongoose'
import SCOPES from '~/config/_scopes'

const { ROLES = {} } = SCOPES || {}
const roles = Object.keys(ROLES)

const schema = mongoose.Schema(
  {
    username: {
      type: String,
      unique: true,
    },
    email: {
      type: String,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    delta: {
      type: Number,
      default: 0,
    },
    name: String,
    firstname: String,
    lastname: String,
    role: {
      type: String,
      enum: roles,
      default: roles[roles.length - 1], // lower ranked role
    },
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } },
)

export default schema
