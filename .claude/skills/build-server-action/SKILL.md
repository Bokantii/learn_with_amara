# Build Server Action

Use this skill for authenticated mutations or server-side operations.

## Before implementation

Inspect how this repository currently handles:

- server actions
- route handlers
- Prisma access
- authentication
- validation
- error responses

Follow the existing preferred pattern.

## Every mutation must consider

1. Authentication
2. Authorization
3. Input validation
4. Resource ownership/scope
5. Database operation
6. Error handling
7. Cache invalidation/revalidation
8. Audit/notification side effects where required

## Security

Never trust values supplied by the client for:

- role
- user ID
- enrollment status
- admin status
- ownership
- payment status
- grading permissions

Resolve these on the server.

## Example workflow

Admin assigns work to a group:

request
→ authenticate admin
→ verify role
→ validate assignment input
→ verify group exists
→ create assignment
→ associate target group
→ create notifications
→ revalidate affected admin/student views
→ return safe result

## Error handling

Distinguish:

- unauthenticated
- unauthorized
- validation failure
- not found
- conflict
- internal failure

Do not leak internal database or stack information to the client.

## Completion

Add tests for authorization and invalid inputs when the operation is security-sensitive.