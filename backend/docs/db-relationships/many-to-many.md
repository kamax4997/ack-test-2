[<< Back](../db-relationships.md)


## Many to Many
A many-to-many (N:N) relationship means a document in a collection [Student] can relate to zero, one, or many documents in another collection [Course]. Many documents in collection [Course] can relate to zero, one, or many  documents in collection [Student].


```
  +---------+                                    +--------+
  | Student |-*--------N-[Enrollment]-N--------*-| Course |
  +---------+                                    +--------+
```

### Summary
one "Student" has many ["Course"]

one "Course" has many ["Student"]*

* may have zero if we set the deletion strategy as weak

### Collection Example


*Student Collection*

student1: `{ _id: ObjectId("5ff43bd547fc9b54b9de96a9"), name: "Mark", courses; [ObjectId("5ff443c54d4fd14e5194b3a9")] }`

student2: `{ _id: ObjectId("5ff43bed9e598728723a4d47"), name: "Jeff", courses; [ObjectId("5ff443c54d4fd14e5194b3a9"), ObjectId("5ff443c54d4fd14e5194b3b9")]  }`

student3: `{ _id: ObjectId("5ff43bed9e598728723a4e47"), name: "Lilly", courses: [ObjectId("5ff443c54d4fd14e5194b3c9")] }`

student4: `{ _id: ObjectId("5ff43bed9e598728723a4f48"), name: "Mary", courses; [ObjectId("5ff443c54d4fd14e5194b3a9"), ObjectId("5ff443c54d4fd14e5194b3b9")] }`

student5: `{ _id: ObjectId("5ff43bed9e598728723a4g49"), name: "Mike", courses; [ObjectId("5ff443c54d4fd14e5194b3a9")] }`

*Course Collection*

course1: `{ _id: ObjectId("5ff443c54d4fd14e5194b3a9"), title: "Math" }`

course2: `{ _id: ObjectId("5ff443c54d4fd14e5194b3b9"), title: "Philosophy" }`

course3: `{ _id: ObjectId("5ff443c54d4fd14e5194b3c9"), title: "Astronomy" }`

### Collection's constraints
No constraints

**Example**:

Delete student1 with _id: `ObjectId("5ff43bd547fc9b54b9de96a9")`
- do nothing as student should not have any deletion tie strategy toward course


Delete course1 with _id: `ObjectId("5ff443c54d4fd14e5194b3a9")`
- remove course1 from courses array of student1, student2, student4 and student5

### Possible ties

student [strong, soft] => course []

course [strong, soft] => student [weak, dirty]


### Additional notes
You should take in consideration the following constraints while deciding where to put the reference array:
- items in the array should never reach four figures
- items in the array should be updated infrequently

Because both of the above the reference array in our example is being part of the Student collection's documents.

Indeed a Course can have hundres, even thousands (think of an online course), of students. Also students can get in and out of a course more frequently.

On the other side a student would have not more that an handful number of courses and it's less likely that he will change them frequently.


For more information follow this link and read the ["Creating documents with large arrays"](https://www.infoq.com/articles/Starting-With-MongoDB/) section
