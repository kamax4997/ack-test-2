import { gql } from '@apollo/client'

export const User = {
  fragments: {
    UserBasicData: gql`
      fragment UserBasicData on User {
        _id
        name
        email
      }
    `,
  },
}
