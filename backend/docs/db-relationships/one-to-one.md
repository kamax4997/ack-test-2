[<< Back](../db-relationships.md)


## One To One
A one-to-one (1:1) relationship means that each document in one collection [Husband] relates to one, and only one, document in another collection [Wife], and each document in collection [Wife] relates to one, and only one, document in collection [Husband]

```
  +---------+                                    +--------+
  | Husband |-*--------1-[Marriage]-1----------*-|  Wife  |
  +---------+                                    +--------+
```

### Summary
one "Husband" has one, and only one, "Wife"

one "Wife" has one, and only one, "Husband"

### Collection Example


*Husband Collection*

husband1: `{ _id: ObjectId("5ff43bd547fc9b54b9de96a9"), name: "Mark" }`

husband2: `{ _id: ObjectId("5ff43bed9e598728723a4d47"), name: "Jeff" }`

*Wife Collection*

wife1: `{ _id: ObjectId("5ff443c54d4fd14e5194b3a9"), husband: ObjectId("5ff43bd547fc9b54b9de96a9"), name: "Lilly" }`

wife2: `{ _id: w2, husband: ObjectId("5ff43bed9e598728723a4d47"), name: "Stephanie" }`

### Collection's constraints
Because it is a one to one relationship we need to enforce the uniqueness of the reference. We do that putting
- wife: { husband ObjectId value => unique }

**Example**:
```
const wifeSchema = mongoose.Schema(
  {
    husband: {
      type: mongoose.ObjectId,
      index: {
        unique: true,
        partialFilterExpression: { // the partial filter is needed for soft deletes. More on that later
          deleted: { $eq: false },
        },
      }      
    },
    name: {
      type: String,
    },
  },
);
```

**Example**:

Delete husband1 with _id: `ObjectId("5ff43bd547fc9b54b9de96a9")`
- strong tie with wife: also delete wife1 (`ObjectId("5ff443c54d4fd14e5194b3a9")`).
- soft tie with wife: also soft delete wife1 (`ObjectId("5ff443c54d4fd14e5194b3a9")`)
- weak tie with wife: also `$unset` (i.e. remove) the field `husband` from wife1 document
- dirty tie: do nothing (as we want to leave the reference there)

Delete wife1 with _id: `ObjectId("5ff443c54d4fd14e5194b3a9")`
- strong tie with husband: also delete husband1, that is the document with _id: `ObjectId("5ff43bd547fc9b54b9de96a9")`
- soft tie with husband: also soft delete husband1, that is the document with _id: `ObjectId("5ff43bd547fc9b54b9de96a9")`
- weak tie with husband: do nothing
- dirty tie: do nothing


### Possible ties

husband [strong, soft] => wife [strong, soft, weak, dirty]

wife [strong, soft] => husband [strong, soft]