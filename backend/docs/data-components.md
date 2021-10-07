[<< Back](../../README.md)

## APOLLO GRAPHQL COMPONENTS
You may create new graphql components just by typing from project's root folder:

`cd backend`

`yarn add-component-part <component_name> <component_part>`

Ex. `yarn add-component-part User user-authentication`

The above will create under `components` a new folder named `User` with a subfolder named
`user-authentication`

`user-authentication` has all files needed to implement your component. You just need to fill them;

- `_input.js`: input types you need for your component part's mutations
- `_mutation.js`: all mutations for this component part go here
- `_query.js`: all queries for this component part go here
- `_type.js`: all types and type resolvers for this component part go here

You may implement only what you need, though you should never delete any of these files. For example
if you have no mutations and no inputs for a component part you should not delete _input.js and
mutations.js. Just leave them there as they were created by the script.

Each component has at least one part, though it can have many.

Ex.
components
```
- components
-- User
--- user-authentication
--- user-data
```

You may want to delete an existing graphql components just by typing from project's root folder:

`cd backend`

`yarn remove-component-part <component_name> <component_part>`

Ex. `yarn remove-component-part User user-authentication`

The above will delete under `components` in the folder named `User` the subfolder named
`user-authentication`

Moreover if the folder named `User` has no more sub-part it will be deleted by the script as well

Otherwise the server/nodemon may not immediately pick up changes in components' structure and even
throw errors (for example adding/deleting components manually),

