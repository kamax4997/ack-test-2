[<< Back](../../README.md)
https://condor.depaul.edu/gandrus/240IT/accesspages/relationships.htm#:~:text=There%20are%20three%20types%20of,to%20the%20data%20and%20tables.
https://observablehq.com/@hugodf/mongodb-objectid-generator
https://docs.mongodb.com/manual/tutorial/model-referenced-one-to-many-relationships-between-documents/#data-modeling-publisher-and-books

## MONGODB SCHEMA RELATIONSHIPS

### Introduction
MongoDB is a schema-less NoSQL document database. It means you can store JSON documents in it, and the structure of these documents can vary as it is not enforced like SQL databases.

However while Mongo is schema-less, this boilerplate uses Mongoose and its `schema` functionality. Schema is a document data structure that is enforced via the application layer.

This helps you to create sql-like relationships where and when needed. It also helps performing cascade deletes through custom helpers.

### Normalized Data Models
The aproach we use is the `normalized data model` that  describes relationships using references between documents.

More precisely we use **manual references** where we save the `_id` field of one document in another document as a **reference**. Then the apollo backend can run a second dataSources query to return the related data. These references are simple and sufficient for most use cases.

### Type of schema relationships
There are three types of relationships between the data you are likely to encounter at this stage in the design:
- [one-to-one](db-relationships/one-to-one.md)
- [one-to-many](db-relationships/one-to-many.md)
- [many-to-many](db-relationships/many-to-many.md)

To be able to identify these relationships, you need to examine the data and have an understanding of what business rules apply to the data and collections.

### Type of tie
With the type of tie we identify what kind of action we'll going to perform when a related document is deleted.

There are 4 types of ties:
- strong
- soft
- weak
- dirty*

*Why the **dirty** option? We can use the dirty option together with soft delete. For instance, you soft delete an husband and use weak on wife, the reference to husband on wife will be rightly removed.

However if later you decide to restore back the husband, the reference to the husband on the wife document has gone so that it will not relate to it anymore. Using dirty will address this issue.

These ties are an opinionated concept that you'll not find elsewhere and that has been introduced to easy cascade delete decisions.
