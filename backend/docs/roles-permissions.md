[<< Back](../../README.md)

### roles-permissions.json
All application roles and permissions are set here

**HIERARCHY BUILDING BLOCKS**

- Top-down: higher users in the tree inherit roles from lower levels as long as they are in the same sub-tree
- Sibilings: sibilings do not inherit permissions from each other despite their order

`{}` creates a tree leaf
`[]` creates a tree leaf of sibilings
`[[]]` creates a sub-tree

Example:

  - `{}` parent (root)
  - `{}` child (a) of [root]
  - `[` grand-children of [root] and children of [a] with same rank, i.e sibilings
        `{}`, child (a1) of [a]
        `{}` child (a2) of [a]
      `]`,
  - `[[`   grand-children of [root] children of [a] in nested (isolated) level, i.e. sub-tree
      `{}` child (a3) of [a]
      `{}` child (a4) of [a]
    `]]`
  - `{}` child (b) of [root]

Real-world example:
```
{
  "OPERATION": {
    "READ": "read",
    "UPDATE": "update",
    "CREATE": "create",
    "DELETE": "delete"
  },
  "SCOPES": {
    "USER_PROFILE": "userProfile",
    "EMPLOYEE_PROFILE": "employeeProfile",
    "BADGE": "badge"
  },
  "GROUPS": {
    "VOLUNTEERS": {
      "PERMISSIONS": {
        "BADGE": [
          "READ"
        ]
      }
    }
  },
  "USERS": [
    {
      "ADMIN": {
        "PERMISSIONS": {
          "USER_PROFILE": [
            "UPDATE",
            "DELETE"
          ],
          "BADGE": [
            "CREATE",
            "UPDATE",
            "DELETE"
          ]
        }
      }
    },
    [[
        [
          {
            "HR": {              
              "PERMISSIONS": {
                "USER_PROFILE": [
                  "CREATE",
                  "READ",
                  "UPDATE"
                ],
                "EMPLOYEE_PROFILE": [
                  "CREATE",
                  "READ",
                  "UPDATE"
                ]
              }
            }
          },
          {
            "STAFF": {
              "GROUPS": ["VOLUNTEERS"],
              "PERMISSIONS": {                
                "EMPLOYEE_PROFILE": [
                  "READ"
                ]
              }
            }
          }
        ]
    ]],
    {
      "USER": {
        "GROUPS": ["VOLUNTEERS"],
        "PERMISSIONS": {
          "USER_PROFILE": [
            "READ",
            "UPDATE"
          ]
        }
      }
    }
  ]
}
```

###### Ouput of the above roles/permissions
```
####################################################
ROLES TREE
####################################################
OWNER
└── ADMIN
    ├── HR|STAFF
    └── USER

####################################################
ROLES' GROUPS AND COMPUTED PERMISSIONS
####################################################

  ROLE: ADMIN
  INHERITED_ROLES: [HR, STAFF, USER]
  GROUPS: []
  ALL PERMISSIONS: [
    update_userProfile
    update_badge
    delete_userProfile
    delete_badge
    create_badge
    create_userProfile
    create_employeeProfile
    read_userProfile
    read_employeeProfile
    update_employeeProfile
    read_badge
  ]

-----------------------------------------------------------------
  
  ROLE: HR
  INHERITED_ROLES: []
  GROUPS: []
  ALL PERMISSIONS: [
    create_userProfile
    create_employeeProfile
    read_userProfile
    read_employeeProfile
    update_userProfile
    update_employeeProfile
  ]

-----------------------------------------------------------------
  
  ROLE: STAFF
  INHERITED_ROLES: []
  GROUPS: [VOLUNTEERS]
  ALL PERMISSIONS: [
    read_employeeProfile
    read_badge
  ]

-----------------------------------------------------------------
  
  ROLE: USER
  INHERITED_ROLES: []
  GROUPS: [VOLUNTEERS]
  ALL PERMISSIONS: [
    read_userProfile
    read_badge
    update_userProfile
  ]

-----------------------------------------------------------------
  
####################################################
PERMISSIONS IN ROLES
####################################################
{
  update_userProfile: [ 'OWNER', 'ADMIN', 'HR', 'USER' ],
  update_badge: [ 'OWNER', 'ADMIN' ],
  update_employeeProfile: [ 'OWNER', 'ADMIN', 'HR' ],
  create_badge: [ 'OWNER', 'ADMIN' ],
  create_userProfile: [ 'OWNER', 'ADMIN', 'HR' ],
  create_employeeProfile: [ 'OWNER', 'ADMIN', 'HR' ],
  read_userProfile: [ 'OWNER', 'ADMIN', 'HR', 'USER' ],
  read_employeeProfile: [ 'OWNER', 'ADMIN', 'HR', 'STAFF' ],
  read_badge: [ 'OWNER', 'ADMIN', 'STAFF', 'USER' ],
  delete_userProfile: [ 'ADMIN' ],
  delete_badge: [ 'ADMIN' ]
}
####################################################
####################################################


```

###### How to enforce roles and permissions in queries and mutations using custom directives

Once the `roles-permissions.json` is saved and the backend server started all roles and permissions custom directive get build programmatically.

You will able to enforce them following this pattern:
Roles: roles.is.{role}
Permissions: permissions.can.{operation}.{scope}

> ###### At field level
```
import { permissions } from '../../../directives';

export const types = `
  type User {
    id: String!
    name: String
    username: String
    email: String @${permissions.can.read.user_profile}
  }`;
```

> ##### at query/mutation level
```
    testPermissionsHasRole: String @${roles.is.admin}
    testPermissionsIsAllowed: String @${permissions.can.read.badge}
```