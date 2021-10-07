import { MongoDataSource } from 'apollo-datasource-mongo'
import { db } from '~/dataconnectors'
import {
  isProduction,
  isTesting,
  useExperimentalConnection,
} from '~/environment'
import relationships from './_relationships'
import { throwIfError } from '../../../utils'

const getDeleteArray = async (relations, ds) => {
  const deleteObj = await relations.reduce(async (obj, relation) => {
    const validIds = relation.ids.filter(id => !!id)
    return {
      ...(await obj),
      ...(await relation?.ties?.reduce(async (o, tie) => {
        let entityIdFields = []
        const ids = await tie.foreignKeys.reduce(async (a, fk) => {
          let items = []
          if (fk.isParentEntityId) {
            // console.log('######', relation.entity, tie.entity, fk.entity, fk.field, fk.isParentEntityId, validIds);
            if (tie.connection === 'weak') {
              // on weak connection and fk.isParentEntityId pass back the relation.ids for later deletion on tie.entity field
            }
            if (tie.connection === 'dirty') {
              items = [] // when connection is dirty, references are left
            } else {
              // Find items that have their fk.field in validIds
              items = await ds[fk.entity][fk.entity].loadManyByQuery({
                [fk.field]: { $in: validIds },
              })
            }
            const existingWeaks = entityIdFields.find(
              efi => efi.collection === fk.entity && efi.field === fk.field,
            )
            if (existingWeaks) {
              entityIdFields = [
                ...entityIdFields.map(efi => {
                  // merge those with same fk.field
                  if (efi.collection === fk.entity && efi.field === fk.field)
                    return {
                      ...existingWeaks,
                      weakIds: [...efi.weakIds, ...existingWeaks.weakIds],
                    }
                  return efi
                }),
              ]
            } else
              entityIdFields = [
                ...entityIdFields,
                {
                  collection: tie.entity,
                  field: fk.field,
                  isArray: fk.isArray,
                  weakIds: validIds,
                },
              ]
          } else if (['weak', 'dirty'].includes(tie.connection)) {
            // TODO: [rico]: see what to do with weak policies and in which part of the code
            if (tie.connection === 'dirty') {
              items = []
              // dirty => do nothing (no ids to delete/soft-delete)
            } else {
              // it's weak connection
              // let weakIds = await ds[fk.entity][fk.entity].find({_id: { $in: validIds }})
              // weakIds = weakIds.map(item => item[fk.field])
              // entityIdFields.push({ entity: fk.entity, field: fk.field, weakIds })
              // items = weakIds
            }
          } else {
            // Find items that have their _id in validIds
            items = await ds[fk.entity][fk.entity].loadManyByQuery({
              _id: { $in: validIds },
            })
            // We only want the fk.field value
            items = items.map(item => item[fk.field])
          }
          // console.log('>>>>', fk.entity, {items: items.map(item => ({ _id: item?._id, [fk.field]: item && item[fk.field]}))}, validIds);
          return [...(await a), ...items.map(item => item?._id)]
        }, [])
        let key = tie.entity
        if (o[tie.entity] || obj[tie.entity]) {
          key = `${tie.entity}.${Math.random()}` // different for later aggregation
        }
        return {
          ...(await o),
          [key]: {
            collection: key,
            deletion: tie.connection,
            entityIdFields,
            ids: ids.filter(v => !!v).map(v => v.toString()), // we do not want ids as objects
          },
        }
      }, {})),
    }
  }, {})
  return Object.entries(deleteObj).reduce((arr, [k, v]) => {
    const fieldKey = k.split('.')[0] // remove randomness of `${tie.entity}.${Math.random()}` if any
    const index = arr.findIndex(
      obj =>
        obj.collection.split('.')[0] === fieldKey &&
        obj.deletion === v.deletion,
    ) // merge those with same deletion policy
    if (index > -1) {
      const newIds = v.ids
      return [
        ...arr.filter((_, idx) => idx !== index),
        {
          ...v,
          ids: [...arr[index].ids, ...newIds],
        },
      ]
    }
    return [...arr, v]
  }, [])
}

const bulkDelete = async ({
  entityIdFields = [],
  userId,
  collection,
  ids = [],
  weak = false,
  strong = false,
  soft = false,
}) => {
  if (!collection || !ids || !ids.length || (!weak && !strong && !soft))
    return null
  const validIds = ids.filter(id => !!id).map(id => id?.toString())
  const connection = useExperimentalConnection ? db[collection] : db
  // console.log(collection, soft, validIds);
  if (weak && !strong && !soft) {
    if (entityIdFields?.length) {
      await entityIdFields.reduce(async (arr, item) => {
        const weakIds = item.weakIds.filter(v => !!v)
        const itemConnection = useExperimentalConnection
          ? db[item.collection]
          : db
        if (item.isArray) {
          await itemConnection.models[item.collection].updateMany(
            { [item.field]: { $in: weakIds } },
            { $pullAll: { [item.field]: weakIds } },
          )
        } else
          await itemConnection.models[item.collection].updateMany(
            { [item.field]: { $exists: true }, [item.field]: { $in: weakIds } },
            { $unset: { [item.field]: true } },
          )
        return arr
      }, [])
    }
    return null
  }
  if (!weak && strong && !soft) {
    await connection.models[collection].deleteMany({ _id: { $in: validIds } })
    // console.log(collection, entityIdFields);
    // if (entityIdFields?.length) {
    //   await entityIdFields.reduce(async (arr, item) => {
    //     const weakIds = item.weakIds.filter(v => !!v)
    //     if (item.isArray) {
    //       await db.models[item.collection].updateMany(
    //         { [item.field]: { $in: weakIds } },
    //         { $pullAll: { [item.field]: weakIds }
    //       })
    //     } else {
    //       // console.log(item.field, item.weakIds);
    //       await db.models[item.collection]
    //         .updateMany({ [item.field]: { $exists: true }, [item.field]: { $in: weakIds } }, { $set: { [item.field]: null } })
    //     }
    //     return await arr
    //   }, [])
    // }
    return null
  }
  if (!weak && !strong && soft) {
    // check if mongoose-delete plugin has been added to the collection
    const isSoftAllowed = Object.keys(connection.models[collection]).includes(
      'delete',
    )
    throwIfError(
      !isSoftAllowed,
      `[Soft-delete][Plugin]: mongoose-delete plugin has not been added yet to ${collection} schema!`,
    )
    if (userId) {
      await connection.models[collection].delete(
        { _id: { $in: validIds } },
        userId,
      )
    } else
      await connection.models[collection].delete({ _id: { $in: validIds } })
  }

  return null
}

const buildDeleteArray = async (entities, ds) => {
  const array = entities.reduce((arr, item) => {
    const index = arr.findIndex(obj => obj.entity === item.entity)
    if (index > -1) {
      const newIds = Array.isArray(item.id) ? item.id : [item.id]
      const existingIds = Array.isArray(arr[index]?.id)
        ? arr[index].id
        : [arr[index].id]
      return [
        ...arr.filter((_, idx) => idx !== index),
        {
          ...item,
          id: [...existingIds, ...newIds],
        },
      ]
    }
    return [
      ...arr,
      {
        ...item,
        id: Array.isArray(item.id) ? item.id : [item.id],
      },
    ]
  }, [])
  const currentEntities = array.map(item => item.entity)
  let collections = relationships.filter(relationship =>
    currentEntities.includes(relationship.entity),
  )
  collections = collections.map((collection, index) => ({
    ...collection,
    ids: array[index]?.id || [],
  }))

  const deleteArray = await getDeleteArray(collections, ds)
  if (deleteArray.length) {
    return [
      ...deleteArray,
      ...(await deleteArray.reduce(
        async (a, item) => [
          ...(await a),
          ...(await getDeleteArray(
            [
              {
                entity: item.collection,
                ids: item.ids,
                ties:
                  relationships.filter(rel => rel.entity === item.collection)[0]
                    ?.ties || [],
              },
            ],
            ds,
          )),
        ],
        [],
      )),
    ]
  }
  return deleteArray
}

export default class extends MongoDataSource {
  async initialize(config) {
    super.initialize({
      ...config,
      debug: !isProduction,
      allowFlushingCollectionCache: true,
    })
  }

  async delete(entities, dry = false) {
    // Ex.
    // entities = { entity: 'Eso', id: '5fd3c27256289907155ab037', deletion: 'soft' } // deletion overrides deletion setting in relationships file
    // entities = { entity: 'Eso', id: ['5fd3c27256289907155ab037'] }
    // entities = [{ entity: 'Eso', id: '5fd3c27256289907155ab037' }]
    // entities = [{ entity: 'Eso', id: ['5fd3c27256289907155ab037'] }]
    // entities = [{ entity: 'Eso', id: '5fd3c27256289907155ab037', entity: 'User', id: '5fd3c27256289907155ab009' }]
    let array = Array.isArray(entities) ? entities : [entities]
    try {
      // check for duplicates
      array.reduce((arr, item) => {
        const duplicate = arr.findIndex(obj => obj.entity === item.entity) > -1
        throwIfError(
          duplicate,
          '[Reationship][Cascade Delete][No Dups][Entity Unique]: There can be just one unique type of entity per entry in the entities array',
        )
        return [...arr, item]
      }, [])
      const currentEntities = array.map(item => item.entity)

      // prepare parent deletions to be used later
      const collections = relationships.reduce((arr, relationship) => {
        if (currentEntities.includes(relationship.entity)) {
          const item = array.find(coll => coll.entity === relationship.entity)

          return [
            ...arr,
            {
              ...relationship,
              deletion: item?.deletion
                ? item.deletion // deletion passed down can override deletion policy in file
                : relationship.deletion,
            },
          ]
        }
        return arr
      }, [])
      const parents = collections.map((collection, index) => ({
        collection: collection.entity,
        deletion: collection.deletion,
        ids: Array.isArray(array[index]?.id)
          ? array[index]?.id
          : [array[index]?.id],
      }))
      // get cascade deletes based on parents and their relationship entity
      array = await buildDeleteArray(array, this.context.dataSources)
      // aggregate items with same collection name and deletion policy
      array = array.reduce((arr, item) => {
        const index = arr.findIndex(
          obj =>
            obj.collection === item.collection &&
            obj.deletion === item.deletion,
        ) // merge those with same deletion policy
        if (index > -1) {
          return [
            ...arr.filter((_, idx) => idx !== index),
            {
              ...item,
              ids: [...new Set([...item.ids, ...arr[index].ids])],
            },
          ]
        }
        // skip ids that already add been added to the array despite the deletion policy (do not care if it does not match)
        // double check if this makes sense in the long run.
        // This should avoid though ambigous behavior when there are inconsistencies between connection deletion policies
        // Ex. original entity deletion is strong, but tie foreign key set it to soft
        const uniqueIds = item.ids?.reduce((a, id) => {
          if (arr.findIndex(it => it.ids.includes(id)) > -1) return a
          return [...a, id]
        }, [])
        if (uniqueIds.length !== item.ids) return arr
        return [...arr, item]
      }, parents) // parents is the tranformed data of the original entities passed in as a param
      if (!isProduction && !isTesting) {
        console.log(JSON.stringify({ 'Deletion Array': array }, null, 2))
      }
      if (dry) return null
      // perform deletions
      await array.reduce(async (a, item) => {
        const { deletion } = item || {}
        switch (deletion) {
          case 'weak':
            await bulkDelete({
              collection: item.collection,
              ids: item.ids,
              entityIdFields: item.entityIdFields,
              weak: true,
            })
            break
          case 'soft':
            await bulkDelete({
              collection: item.collection,
              ids: item.ids,
              soft: true,
              userId: this.context.user?.id,
            })
            break
          case 'strong':
            await bulkDelete({
              collection: item.collection,
              ids: item.ids,
              strong: true,
              entityIdFields: item.entityIdFields,
            })
            break
          default:
            break
        }
        return a
      }, [])
    } catch (e) {
      console.log(e)
      return e
    }

    return array
  }
}
