# Implement Feature

Use this skill when implementing a new ICLP feature or completing a partially built feature.

## Objective

Implement the requested feature while preserving the existing architecture, UI patterns, authorization model, and product requirements defined in SPEC.md.

## Required workflow

1. Read the relevant sections of:
   - CLAUDE.md
   - SPEC.md

2. Inspect the current implementation before changing anything.

3. Identify:
   - affected routes
   - components
   - Prisma models
   - server actions/API handlers
   - authorization rules
   - tests
   - existing reusable utilities

4. Determine whether the feature is:
   - missing
   - partially implemented
   - hardcoded
   - implemented but broken

5. Prefer extending existing patterns over introducing new abstractions.

6. Do not redesign working UI unless SPEC.md explicitly requires it.

7. Do not introduce fake production data.

8. Implement the smallest coherent end-to-end slice.

9. Add:
   - loading states
   - error states
   - empty states
   - validation
   - authorization
   - tests where appropriate

10. Run:
   - typecheck
   - lint
   - relevant tests
   - production build when appropriate

## Completion criteria

A feature is not complete merely because the UI renders.

It is complete only when:

- data persists correctly
- authorization is enforced server-side
- relevant student/admin views stay synchronized
- errors are handled
- no unnecessary hardcoded business data remains
- tests pass
- existing functionality remains intact

## Output

After implementation report:

- files changed
- architectural decisions
- schema changes
- authorization changes
- tests added/run
- unresolved issues