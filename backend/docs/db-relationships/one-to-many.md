[<< Back](../db-relationships.md)


## One To Many
A one-to-many (1:N) relationship means a document in a collection [Author] can relate to zero, one, or many documents in another collection [Post]. Many documents in collection [Post] can relate to one document in collection [Author].

The potential relationship is what's important; for a single in collection [Author], there might be no related documents in collection [Post], or there might be only one related document, but there could be many.


```
  +---------+                                    +--------+
  | Author  |-*--------1-[Writing]-N-----------*-|  Post  |
  +---------+                                    +--------+
```

### Summary
one "Author" has zero, one or many ["Post"]

one "Post" has one "Author"*

* may have zero if we set the deletion strategy as weak

### Collection Example


*Author Collection*

author1: `{ _id: ObjectId("5ff43bd547fc9b54b9de96a9"), name: "Mark" }`

author2: `{ _id: ObjectId("5ff43bed9e598728723a4d47"), name: "Jeff" }`

*Post Collection*

post1: `{ _id: ObjectId("5ff443c54d4fd14e5194b3a9"), author: ObjectId("5ff43bd547fc9b54b9de96a9"), title: "7 things you must now in life" }`

post2: `{ _id: ObjectId("5ff443c54d4fd14e5194b3b9"), author: ObjectId("5ff443c54d4fd14e5194b3a9"), title: "Prepare for your first Marathon" }`

post3: `{ _id: ObjectId("5ff443c54d4fd14e5194b3c9"), author: ObjectId("5ff43bed9e598728723a4d47"), title: "Advanced Javascript programming techniques explained" }`

### Collection's constraints
No constraints

**Example**:

Delete author1 with _id: `ObjectId("5ff43bd547fc9b54b9de96a9")`
- strong tie with post:
  - also delete post1 (`ObjectId("5ff443c54d4fd14e5194b3a9")`).
  - also delete post2 (`ObjectId("5ff443c54d4fd14e5194b3b9")`).
- soft tie with post:
  - also soft delete post1 (`ObjectId("5ff443c54d4fd14e5194b3a9")`)
  - also soft delete post2 (`ObjectId("5ff443c54d4fd14e5194b3b9")`)
- weak tie with post: also `$unset` (i.e. remove) the field `author` from post1 and post2 documents
- dirty tie: do nothing (as we want to leave the reference there)

Delete post1 with _id: `ObjectId("5ff443c54d4fd14e5194b3a9")`
- do nothing as post should not have any deletion tie strategy toward author.

### Possible ties

author [strong, soft] => post [strong, soft, weak, dirty]

post [strong, soft] => author []


## NOTE

It is worth noting that you may be thinking about implementing a  **many to one** relatinoship like the following, for example:

```
  +---------+                                    +--------+
  | Student |-*--------N-[Writing]-1-----------*-| School |
  +---------+                                    +--------+
```

one "Student" has one "School"
one "School" has many ["Student"]

This is the same ame has *one-to-many*, only from a different perspective.
