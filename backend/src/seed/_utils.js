export const getRolePermissions = permissions =>
  Object.entries(permissions).reduce(
    (array, entry) => [
      ...array,
      ...Object.entries(entry[1]).map(e => `${entry[0]}_${e[1]}`),
    ],
    [],
  )

export const getRolesFromSpec = roles =>
  Object.entries(roles).map(entry => ({
    rank: entry[1].SPEC.RANK,
    value: entry[1].SPEC.VALUE,
    permissions: getRolePermissions(entry[1].PERMISSIONS),
  }))
