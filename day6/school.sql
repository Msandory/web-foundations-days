-- Re-run safely: drop tables in the right order (children first)
DROP TABLE IF EXISTS enrolments;
DROP TABLE IF EXISTS courses;
DROP TABLE IF EXISTS students;

-- Make SQLite enforce foreign keys
PRAGMA foreign_keys = ON;

-- ========== TABLES ==========

CREATE TABLE students (
  student_id INTEGER PRIMARY KEY AUTOINCREMENT,
  name       TEXT NOT NULL,
  email      TEXT NOT NULL UNIQUE
);

CREATE TABLE courses (
  course_id INTEGER PRIMARY KEY AUTOINCREMENT,
  title     TEXT NOT NULL,
  credits   INTEGER NOT NULL
);

CREATE TABLE enrolments (
  enrolment_id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id   INTEGER NOT NULL,
  course_id    INTEGER NOT NULL,
  grade        TEXT,  -- can be NULL until a grade is given
  FOREIGN KEY (student_id) REFERENCES students (student_id),
  FOREIGN KEY (course_id)  REFERENCES courses (course_id),
  UNIQUE (student_id, course_id)  -- same student cannot enrol on the same course twice
);

-- ========== SAMPLE DATA ==========

INSERT INTO students (name, email) VALUES
  ('Thandi Dlamini',  'thandi@example.com'),
  ('Sipho Nkosi',     'sipho@example.com'),
  ('Lindiwe Mamba',   'lindiwe@example.com'),
  ('Mandla Simelane', 'mandla@example.com');

INSERT INTO courses (title, credits) VALUES
  ('Web Development',   10),
  ('Databases',         10),
  ('Python Programming', 15);

INSERT INTO enrolments (student_id, course_id, grade) VALUES
  (1, 1, 'A'),
  (1, 2, 'B'),
  (2, 1, 'C'),
  (2, 3, NULL),
  (3, 2, 'A'),
  (3, 3, 'B');

-- ========== QUERIES ==========

-- 1. All courses for one student (by name)
SELECT c.title, e.grade
FROM students s
JOIN enrolments e ON e.student_id = s.student_id
JOIN courses c    ON c.course_id  = e.course_id
WHERE s.name = 'Thandi Dlamini';

-- 2. All students on one course
SELECT s.name, s.email
FROM courses c
JOIN enrolments e ON e.course_id  = c.course_id
JOIN students s   ON s.student_id = e.student_id
WHERE c.title = 'Web Development';

-- 3. Number of students per course
SELECT c.title, COUNT(e.enrolment_id) AS student_count
FROM courses c
LEFT JOIN enrolments e ON e.course_id = c.course_id
GROUP BY c.course_id, c.title;

-- 4. Students who have no enrolments
SELECT s.name
FROM students s
LEFT JOIN enrolments e ON e.student_id = s.student_id
WHERE e.enrolment_id IS NULL;

-- 5. Update one enrolment's grade
UPDATE enrolments
SET grade = 'A'
WHERE student_id = (SELECT student_id FROM students WHERE name = 'Sipho Nkosi')
  AND course_id  = (SELECT course_id FROM courses WHERE title = 'Python Programming');

-- Check the update worked
SELECT s.name, c.title, e.grade
FROM enrolments e
JOIN students s ON s.student_id = e.student_id
JOIN courses c  ON c.course_id  = e.course_id
WHERE s.name = 'Sipho Nkosi';