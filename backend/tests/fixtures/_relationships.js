export default [
  {
    entity: 'User',
    deletion: 'soft', // default: strong
    ties: [
      {
        entity: 'Partner',
        connection: 'strong',
        foreignKeys: [
          {
            entity: 'Partner',
            field: 'partner',
            isParentEntityId: true,
          },
        ],
      },
      {
        entity: 'Course',
        connection: 'weak',
        foreignKeys: [
          {
            entity: 'Course',
            field: 'students',
            isParentEntityId: true,
            isArray: true, // default: false
          },
        ],
      },
      {
        entity: 'Resource',
        connection: 'weak',
        foreignKeys: [
          {
            entity: 'Resource',
            field: 'author',
            isParentEntityId: true,
          },
        ],
      },
      {
        entity: 'Message',
        connection: 'weak',
        foreignKeys: [
          {
            entity: 'Message',
            field: 'sender',
            isParentEntityId: true,
          },
          {
            entity: 'Message',
            field: 'receiver',
            isParentEntityId: true,
          },
        ],
      },
      {
        entity: 'Company',
        connection: 'soft',
        foreignKeys: [
          {
            entity: 'Company',
            field: 'owner',
            isParentEntityId: true,
          },
        ],
      },
    ],
  },
  {
    entity: 'Resource',
    deletion: 'strong',
    ties: [
      {
        entity: 'User',
        connection: 'weak',
        foreignKeys: [
          {
            entity: 'Resource',
            field: 'author',
            isParentEntityId: false,
          },
        ],
      },
    ],
  },
  {
    entity: 'Company',
    deletion: 'strong',
    ties: [
      {
        entity: 'User',
        connection: 'soft',
        foreignKeys: [
          {
            entity: 'Company',
            field: 'owner',
            isParentEntityId: false,
          },
        ],
      },
    ],
  },
  {
    entity: 'Partner',
    deletion: 'strong',
    ties: [
      {
        entity: 'User',
        connection: 'strong',
        foreignKeys: [
          {
            entity: 'Partner',
            field: 'partner',
            isParentEntityId: false,
          },
        ],
      },
    ],
  },
  {
    entity: 'Husband_strong',
    deletion: 'strong', // default: strong
    ties: [
      {
        entity: 'Wife_strong',
        connection: 'strong',
        foreignKeys: [
          {
            entity: 'Wife_strong',
            field: 'husband',
            isParentEntityId: true,
          },
        ],
      },
    ],
  },
  {
    entity: 'Husband_soft',
    deletion: 'soft', // default: strong
    ties: [
      {
        entity: 'Wife_soft',
        connection: 'soft',
        foreignKeys: [
          {
            entity: 'Wife_soft',
            field: 'husband',
            isParentEntityId: true,
          },
        ],
      },
    ],
  },
  {
    entity: 'Husband_weak',
    deletion: 'soft', // default: strong
    ties: [
      {
        entity: 'Wife_weak',
        connection: 'weak',
        foreignKeys: [
          {
            entity: 'Wife_weak',
            field: 'husband',
            isParentEntityId: true,
          },
        ],
      },
    ],
  },
  {
    entity: 'Family',
    deletion: 'soft', // default: strong
    ties: [
      {
        entity: 'Member',
        connection: 'weak',
        foreignKeys: [
          {
            entity: 'Member',
            field: 'families',
            isArray: true,
            isParentEntityId: true,
          },
        ],
      },
    ],
  },
]
