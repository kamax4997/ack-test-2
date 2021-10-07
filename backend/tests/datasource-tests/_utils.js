const doesArrayContainsSomeIds = (array = [], ids) => {
  return array.some(value => ids.includes(value))
}

const entityIdFieldsLengthValidation = (item, entityIdFields) =>
  entityIdFields.filter(efi => {
    return efi.isArray
      ? !!item.object &&
          !!item.object[efi.field] &&
          doesArrayContainsSomeIds(item.object[efi.field], efi.weakIds)
      : !!item.object && !!item.object[efi.field]
  }).length

const checks = {
  findOne: {
    strong: item => !item.findOne,
    soft: item => !item.findOne,
    weak: (item, entityIdFields = []) =>
      !!item.findOne &&
      entityIdFieldsLengthValidation(item, entityIdFields) <
        entityIdFields.length,
  },
  findOneDeleted: {
    strong: item => !item.findOneDeleted,
    soft: item => !!item.findOneDeleted,
    weak: item => !item.findOneDeleted,
  },
  findOneWithDeleted: {
    strong: item => !item.findOneWithDeleted,
    soft: item => !!item.findOneWithDeleted,
    weak: (item, entityIdFields = []) =>
      !!item.findWithDeleted &&
      entityIdFieldsLengthValidation(item, entityIdFields) <
        entityIdFields.length,
  },
  loadOne: {
    strong: item => !item.loadOne,
    soft: item => !item.loadOne,
    weak: (item, entityIdFields = []) =>
      !!item.loadOne &&
      entityIdFieldsLengthValidation(item, entityIdFields) <
        entityIdFields.length,
  },
  find: {
    strong: item => item.find.indexOf(false) > -1,
    soft: item => item.find.indexOf(false) > -1,
    weak: (item, entityIdFields = []) =>
      item.find.indexOf(true) > -1 &&
      entityIdFieldsLengthValidation(item, entityIdFields) <
        entityIdFields.length,
  },
  findDeleted: {
    strong: item => item.findDeleted.indexOf(false) > -1,
    soft: item => item.findDeleted.indexOf(true) > -1,
    weak: item => item.findDeleted.indexOf(false) > -1,
  },
  findWithDeleted: {
    strong: item => item.findWithDeleted.indexOf(false) > -1,
    soft: item => item.findWithDeleted.indexOf(true) > -1,
    weak: (item, entityIdFields = []) =>
      item.findWithDeleted.indexOf(true) > -1 &&
      entityIdFieldsLengthValidation(item, entityIdFields) <
        entityIdFields.length,
  },
  loadMany: {
    strong: item => item.loadMany.indexOf(false) > -1,
    soft: item => item.loadMany.indexOf(false) > -1,
    weak: (item, entityIdFields = []) =>
      item.loadMany.indexOf(true) > -1 &&
      entityIdFieldsLengthValidation(item, entityIdFields) <
        entityIdFields.length,
  },
}

export const deletionChecks = ({
  deletedItem,
  entityIdFields = [],
  // collection,
  deletion = 'strong',
}) => {
  // console.log(collection, {entityIdFields});
  const test = Object.keys(checks).reduce((value, checkKey) => {
    // return value && (!deletedItem[checkKey] || checks[checkKey][deletion](deletedItem))
    return value && checks[checkKey][deletion](deletedItem, entityIdFields)
  }, true)
  return test
}
