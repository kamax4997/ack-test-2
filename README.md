# ack-test-2
Set of questions regarding the apollo-connector-mongoose-kit and grapqhl in general

## Preparing the environment
To clone this repository on you local and start working on the questions follow this steps:
1. Fork this repo to your github account
2. Invite both **mohammed8079** and **ecerroni** as collaborators of the repository
3. Clone your forked repository to your local
4. Open a branch for the specific exercise number (ex. `test/db/1`)
5. Do your work, commit and push to the origin branch
6. When ready open a PR to master of your fork and assign mohammed8079/ecerroni as reviewers. Do not forget to use a title as the test title in this readme and a descrition of the work you did
7. mohammed8079/ecerroni will review the code
8. If ok, they'll ask you to merge
9. For next exercise start over from point 4

Note: Each subsequent branch must be created from master after the previous PR has been merged. Example:
Test/db/2 Branch cannot be created before Test/db/1 Branch has been merged to main.
Test branches always branc out from main branch, never from other branches.

## Installation
From the root of the cloned project run `yarn install-all`

## Dev servers
Run servers separately using a different terminal for each.

### Running backend
`cd backend && yarn start`
Server is running on port 9000


### Runnning frontend
`cd frontend-react && yarn start`

Server is running on port 9001

### Mongodb
This repo assumes you have mongodb running on localhost on port 27017. You can either install mongo on your machine or running it using [Mongo's Docker image](https://hub.docker.com/_/mongo) (highly recommended)

Optionally you can also install [Robo3T](https://robomongo.org/download), a free GUI for Mongodb that lets you explore the mongo dbs and their collections.

## Exercises
There are tree mocked users you may use for your exercies:

`rico` with ROLE ADMIN
`george` with ROLE USER
`mike` with ROLE STAFF

They share the same password: `123456`

When you need to test a role/permission query this would be the procedure:
- launch both frontend and backend, but in separate terminals
- go to http://localhost:9001
- login in with the user of choice
- open dev tools and click on the [apollo dev tool](https://chrome.google.com/webstore/detail/apollo-client-developer-t/jdkknkkbebbapilgoeccciglkfbmbnfm) tab
![](/assets/apollo-graphiql.png)
- now that you are logged in you can use the graphiql of apollo to query your backend queries/mutation and it will automatically use the tokens you got by loggin in with the user. You need this to text the role/permission functionalities while you're coding your exercise


To logout open dev tools => Application tab => delete tokens. Finally refresh the browser
![](/assets/application-tab.png)
### DB DATASOURCE
*Branch: Test/db/1*
*PR: Create DB Datasource (DB DATASOURCE)*

*NOTE*: when creating new datasources keep in mind that `User` and `Relationship` datasources are special ones and that you should refer to the `Dummy` datasources only when creating new ones.

**New DB Datasource**
- Copy the datasource dummy folder in `/backend/src/datasources/db/Dummy` and paste it in `/backend/src/datasources/db` changing it's folder name to `Post` and also change the name in the `_name.js` file accordingly to adjust to the new datasource [**Commit**: New datasource]
- change `_schema.js` file to reflect this Post's criteria: [**Commit**: New datasource schema]
  ```
  It has a title of type String
  It has a content of type String
  ```
- In `/backend/src/dataconnectors/_db-sources` import the newly created datasource and then add it in the default export object [**Commit**: New datasource export]

-----



### CRUD DATASOURCES
*Branch: Test/db/2*

*PR: Datasource basic add/read (CRUD DATASOURCES)*

*Requirements:  Test/db/1 approved and merged*

*NOTE*: All new datasources inherit from the base model. There are methods that the new datasource can use. That is what we'll do here. In late test exercices we'll create custom methods for the datasource

**Add new document to collection**
  1. Create a new mutation that accept a mandatory Post type (title + content) and adds it to the Post collection. In the datacomponent use `dataSources.Post.save(postdata)` that is already availabe in the Post datasource (inherited from the base model)[**Commit**: Add document to Post collection]
  2. Create a new query with no args that finds all posts in Post collection and return an array of posts (i.e **[Post]**). In the datacomponent use `dataSources.Post.getMany({})` that is already availabe in the Post datasource (inherited from the base model)[**Commit**: Find all documents from Post collection]
  3. Create a new query with a mandotory `id` arg of type `ID` that find the post with that _id in the Post collection and return return the document itself (i.e **Post**). In the datacomponent use `dataSources.Post.getById(id)` that is already availabe in the Post datasource (inherited from the base model). For this task you need to copy and use any existing _id from the Post collection documents in the database[**Commit**: Find a document by _id in Post collection]

-----
*Branch: Test/db/3*

*PR: Datasource medium add/read (CRUD DATASOURCES)*

*Requirements:  Test/db/2 approved and merged*

**Add new document to collection together with author**
  
  1. Extend the Post's schema with the following addional field [**Commit**: Add author to Post schema]:
  - `author` field of type ObjectId 
  2. Extend the previous `addPost` mutation with the following additions [**Commit**: Add document with author to Post collection]:
  - make the mutaion protected to `user` role only
  - get the user id from the context and pass it to the datasource merged into the postdata so that the postdata contains the original data + the id of the user (in the form `author: user?.id`)
  datacomponent use `dataSources.Post.save(enrichedPostdata)` that is already availabe in the Post datasource (inherited from the base model)


  -----
*Branch: Test/db/4*

*PR: Datasource advanced read (CRUD DATASOURCES)*

*Requirements:  Test/db/3 approved and merged*

NOTE: this section uses datasource loaders. They are:
```
loadOne(id): finds the document by id
loadMany(id): finds all the documents by each id that is passed
loadManyByQuery(query): find all the documents based on the query
```
This loaders have been implemented to deal with Graphql's **N + 1** problem that occurs when processing a query involves performing one initial request to a data source along with n subsequent requests in order to fetch all of the data, basically hitting the db with the same query multiple times.

If you are curious about how it works in general here there is a good [visual explanation](https://productionreadygraphql.com/blog/2019-07-15-the-graphql-dataloader-pattern-visualized) of the approach. Even if the example uses SQL the concept applies to Mongo as well.

**Queries with conditions and type resolvers**
  1. Create a new query with optional args (ex. `getPostsAfterDate`) with `date: DateTime!` as the arg that finds all posts in Post collection where the `created_at` field is **not smaller** than the `date` in the arguments and return an array of posts (i.e **[Post]**). In the datacomponent use `dataSources.Post.getMany({ ...conditionsForCreatedAt })` that is already availabe in the Post datasource (inherited from the base model). For this task refer to this [mongo's documentation](https://docs.mongodb.com/manual/reference/operator/query/gte/) on how to conditionally find documents in a collection  [**Commit**: Find all documents starting at given date from Post collection]
  2. Add a type resolver in the type `User` for the field `author` by adding a datasource **loader** from the `User` datasource. Use `dataSources.User.loadOne(author)`. To test if it is working query using any of the previous queries for `title`, `content`, `user { _id, name }` [**Commit**: Find all documents including author from Post collection]
  3. Create a new query called `allMyPosts` that finds all posts made by an me (i.e. the logged in user) with the following criteria: [**Commit**: Find all documents of a logged in user from Post collection]
  - Author's id comes from context (i.e. `user.id`)
  - query should return an array of posts (i.e. `[Post]`)
  - In the datacomponent use `dataSources.Post.getMany({ ...conditionsForAuthor })`
  4. Create a new field in the User type called `posts` that returns all posts made by that user by adding a type resolver for `posts` in type `User` and using a datasource multi-loader (i.e. `dataSources.Post.loadMany(postId)`). To test if it is working query for User with `{ _id, name, posts { title, content } }` [**Commit**: Add posts to type User from Post collection]
  5. Create a new field in the User type `lastSevenDaysPosts` of `[Post]`. Add a type resolver for the `lastSevenDaysPosts` field that finds all posts made by the user in the last week, use a datasource queryloader (i.e. `dataSources.Post.loadManyByQuery({ ...queryConditions })`). To test if it is working query for User with `{ _id, name, posts { title, content } }` [**Commit**: Add last week posts to User]
  
  