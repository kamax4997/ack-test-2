import to from 'await-to-js'
import { throwIfError } from '~/utils'
import RelationshipBuilder from './'
import relationships from './_relationships'
import { relationshipSchema } from './_schema'

export default async db => {
  const [err] = await to(relationshipSchema.validate(relationships))
  throwIfError(
    err,
    `[DB][RELATIONSHIP][SCHEMA][VALIDATION][ERROR] | ${JSON.stringify(
      err,
      null,
      2,
    )}`,
  )
  const relationship = RelationshipBuilder(db)
  return relationship
}
