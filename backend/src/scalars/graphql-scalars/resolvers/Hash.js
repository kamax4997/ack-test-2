import { GraphQLScalarType, Kind } from 'graphql'
import { ValidationError } from 'apollo-server-express'
import validator from '../../validator'

function validate(value) {
  if (!validator.isHash(value))
    throw new ValidationError(
      'Value must be a non-empty Base58-based string with a length of 64 characters',
    )
  return value
}

const GraphQLHash = new GraphQLScalarType({
  name: 'Hash',
  description:
    'The «Hash» scalar type represents a non-empty Base58-based string with a length of 64 characters',
  parseValue: validate,
  serialize: validate,
  parseLiteral: ast => {
    switch (ast.kind) {
      case Kind.STRING:
        return validate(ast.value)
      default:
        break
    }
    return null
  },
})

export default GraphQLHash
