import { GraphQLScalarType } from 'graphql'
import { Kind, print } from 'graphql/language'
import { isSanitized } from 'mongodb-sanitize'

function identity(value) {
  return value
}

function ensureObject(value) {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new TypeError(
      `[MJSON]: MJSON cannot represent non-object value: ${value}`,
    )
  }
  if (!isSanitized(value)) {
    throw new TypeError(
      `[MJSON]: This JSON contains unsafe NoSQL for mongodb: ${JSON.stringify(
        value,
        null,
        2,
      )}`,
    )
  }

  return value
}

function parseObject(typeName, ast, variables) {
  const value = Object.create(null)
  ast.fields.forEach(field => {
    // eslint-disable-next-line no-use-before-define
    value[field.name.value] = parseLiteral(typeName, field.value, variables)
  })

  return value
}

function parseLiteral(typeName, ast, variables) {
  switch (ast.kind) {
    case Kind.STRING:
    case Kind.BOOLEAN:
      return ast.value
    case Kind.INT:
    case Kind.FLOAT:
      return parseFloat(ast.value)
    case Kind.OBJECT:
      return parseObject(typeName, ast, variables)
    case Kind.LIST:
      return ast.values.map(n => parseLiteral(typeName, n, variables))
    case Kind.NULL:
      return null
    case Kind.VARIABLE:
      return variables ? variables[ast.name.value] : undefined
    default:
      throw new TypeError(`${typeName} cannot represent value: ${print(ast)}`)
  }
}

// This named export is intended for users of CommonJS. Users of ES modules
//  should instead use the default export.
const MJSON = new GraphQLScalarType({
  name: 'MJSON',
  description:
    // eslint-disable-next-line max-len
    'The `MJSON` scalar type represents JSON values as specified by [ECMA-404](http://www.ecma-international.org/publications/files/ECMA-ST/ECMA-404.pdf). that do not contains values, like $in, that is unsafe for mongodb',
  specifiedByUrl:
    'http://www.ecma-international.org/publications/files/ECMA-ST/ECMA-404.pdf',
  serialize: identity,
  parseValue: ensureObject,
  parseLiteral: (ast, variables) => parseLiteral('MJSON', ast, variables),
})

export default MJSON
