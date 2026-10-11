# School Database Design

## Tables

### students
Stores one row per student: a unique `student_id` (primary key), the student's `name` and their `email`. The email is `NOT NULL` and `UNIQUE` so two students cannot share one address.

### courses
Stores one row per course: `course_id` (primary key), `title` and `credits`. Both title and credits are required.

### enrolments
Records the fact that a student is enrolled on a course. It has its own `enrolment_id`, a `student_id` and a `course_id` (both foreign keys, both `NOT NULL`), and a `grade` that stays empty until one is given. A `UNIQUE (student_id, course_id)` rule stops the same student enrolling on the same course twice.

## Relationships

- **students to enrolments: one-to-many.** One student can have many enrolments, but each enrolment belongs to exactly one student.
- **courses to enrolments: one-to-many.** One course can have many enrolments, but each enrolment belongs to exactly one course.
- **students to courses: many-to-many.** A student can take many courses, and a course has many students. This is the combination of the two one-to-many relationships above.

A join table is needed because a single column cannot hold many values in a relational database. Putting a list of course ids inside `students` (or student ids inside `courses`) would break the rules of the model and make querying, counting and enforcing foreign keys very hard. The `enrolments` table solves this by storing one row per student-course pair. It also has a natural home for data that belongs to the relationship itself, which is the grade.

## Index

I would add an index on `enrolments(course_id)`. The `UNIQUE (student_id, course_id)` rule already creates an index that helps lookups by student, but queries such as "all students on one course" or "number of students per course" filter and join on `course_id`, so without its own index the database may have to scan the whole enrolments table. As the number of enrolments grows, the index keeps these lookups fast. The trade-off is slightly slower inserts and some extra storage.

```sql
CREATE INDEX idx_enrolments_course_id ON enrolments (course_id);
```

## SQL or NoSQL?

I would choose SQL for this system. The data is clearly structured and relational: students, courses and enrolments have fixed fields and well-defined links between them. A SQL database enforces those links with foreign keys, prevents duplicates with UNIQUE rules, and handles questions like "how many students per course" or "which students have no enrolments" naturally with JOIN and GROUP BY. Data correctness matters for school records such as grades, and SQL gives strong consistency. NoSQL would suit data with a flexible or changing shape, or huge scale with simple lookups, but this system needs neither.