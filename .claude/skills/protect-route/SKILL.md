# Protect Route

Use this skill whenever creating or reviewing protected student, instructor, or admin functionality.

## Principle

Authentication proves identity.

Authorization determines access.

Never treat them as the same thing.

## Roles

Use the role model defined by the current project and SPEC.md.

Potential ICLP roles include:

- USER
- STUDENT
- INSTRUCTOR
- ADMIN

Do not add new roles unless required.

## Student LMS access

A signed-in account does not automatically equal an enrolled student.

Student dashboard access should require the appropriate enrollment/account state defined in SPEC.md.

## Admin access

Admin routes must verify admin privileges server-side.

Never rely only on:

- hidden UI
- client-side redirects
- localStorage
- query parameters
- client state
- disabled buttons

## Resource-level checks

Role checks alone may be insufficient.

Examples:

A student requesting an assignment must also be entitled to that assignment.

An instructor grading a submission must be permitted to grade that program/group/student.

## Testing matrix

For protected functionality test at least:

1. unauthenticated user
2. authenticated unauthorized user
3. authorized user
4. resource belonging to another user when applicable

## Failure behavior

Return or redirect appropriately without exposing protected data.

Authorization must happen before sensitive records are returned.