# Design Prisma Schema

Use this skill when adding or changing persistent domain models.

## Before modifying schema.prisma

1. Inspect the existing Prisma provider.
2. Inspect existing model naming conventions.
3. Inspect existing IDs, timestamps, relations, indexes, and enums.
4. Search for models that can be extended before creating new ones.
5. Read relevant requirements from SPEC.md.

Never assume the database provider.

## Model design principles

Prefer normalized domain relationships over duplicated derived values.

Example:

Do not model:

Student {
  program String
  averageScore Float
  attendanceRate Float
}

Prefer relationships such as:

User
Enrollment
Program
AssessmentAttempt
AttendanceRecord

and derive aggregates where appropriate.

## Required considerations

For each new model consider:

- primary key
- foreign keys
- relation cardinality
- cascading behavior
- indexes
- uniqueness
- status enums
- createdAt
- updatedAt
- optional vs required fields
- deletion strategy
- expected query patterns

## ICLP domain considerations

Common relationships include:

User
Enrollment
Program
Module
Lesson
LessonProgress
Group
GroupMembership
LiveClass
Assignment
Submission
Grade
Assessment
AssessmentAttempt
AttendanceSession
AttendanceRecord
Notification
Announcement
Payment

Do not create all models simply because they appear in this list. Only create what the feature requires.

## Migration safety

Before creating a migration:

- assess existing data
- avoid destructive changes where possible
- provide defaults or backfill strategy when needed
- inspect generated migration
- do not reset production data

## After schema changes

Run the appropriate Prisma commands and typecheck.

Report:

- models added/changed
- relationships
- indexes
- migration impact
- data migration/backfill requirements