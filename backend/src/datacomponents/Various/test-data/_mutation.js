import { userInputValidation } from '~/utils'
import { roles } from '~/directives'
import inputSchema from './_yup'

export const mutationTypes = `
  type Mutation {
    testInputValidationOnMutation(yup: Int, text: String): JSON
    testCascadeDeleteResourcesSingle(input: MJSON!): JSON @${roles.is.admin}
  }
`

export const mutationResolvers = {
  Mutation: {
    testInputValidationOnMutation: userInputValidation(
      inputSchema.inputTest,
      // eslint-disable-next-line
      (_, args, context) => {
        return args
      },
    ),
    testCascadeDeleteResourcesSingle: async (_, args, { dataSources }) => {
      const { input } = args || {}
      const { multi } = input
      const data = multi ? input?.data ?? {} : input
      const deleteArray = await dataSources.Relationship.delete(data)
      const checks = await deleteArray.reduce(async (arr, item) => {
        return [
          ...(await arr),
          {
            collection: item.collection,
            deletion: item.deletion,
            entityIdFields: item.entityIdFields,
            ids: item.ids,
            items: await item.ids.reduce(async (o, id) => {
              const findOne = await dataSources[item.collection].getOne({
                _id: id,
              })
              const findOneDeleted = await dataSources[
                item.collection
              ].getOneDeleted({ _id: id })
              const findOneWithDeleted = await dataSources[
                item.collection
              ].getOneWithDeleted({ _id: id })
              const find = await dataSources[item.collection].getMany({})
              const findDeleted = await dataSources[
                item.collection
              ].getManyDeleted({})
              const findWithDeleted = await dataSources[
                item.collection
              ].getManyWithDeleted({})
              const loadOne = await dataSources[item.collection].loadOne(id)
              const loadMany = await dataSources[item.collection].loadMany([id])
              return {
                ...(await o),
                [id]: [
                  { object: findOne },
                  { idType: typeof id },
                  { findOne: findOne?._id?.toString() === id },
                  { findOneDeleted: findOneDeleted?._id?.toString() === id },
                  {
                    findOneWithDeleted:
                      findOneWithDeleted?._id?.toString() === id,
                  },
                  { loadOne: loadOne?._id?.toString() === id },
                  {
                    /* eslint-disable no-shadow */
                    find: [
                      find?.map(item => item._id),
                      find?.filter(item => item._id?.toString() === id)
                        ?.length > 0,
                    ],
                  },
                  {
                    findDeleted: [
                      findDeleted?.map(item => item._id),
                      findDeleted?.filter(item => item._id?.toString() === id)
                        ?.length > 0,
                    ],
                  },
                  {
                    findWithDeleted: [
                      findWithDeleted?.map(item => item._id),
                      findWithDeleted?.filter(
                        item => item._id?.toString() === id,
                      )?.length > 0,
                    ],
                  },
                  {
                    loadMany: [
                      loadMany.map(item => item._id),
                      loadMany?.filter(item => item._id?.toString() === id)
                        ?.length > 0,
                    ],
                  },
                ],
              }
            }, {}),
          },
        ]
      }, [])
      return checks
    },
  },
}
