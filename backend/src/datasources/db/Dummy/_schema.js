import mongoose from 'mongoose'

const schema = mongoose.Schema(
  {
    name: String,
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } },
)

export default schema
