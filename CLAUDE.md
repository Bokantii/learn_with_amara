# CLAUDE.md — ICLP Engineering Operating Guide

This file defines how Claude Code should work inside the ICLP repository.

The product source of truth is [`SPEC.md`](./SPEC.md). Read the relevant SPEC sections before designing or implementing behavior.

---

## 1. Mission

Finish and harden the existing ICLP web application as a real, secure, database-backed learning-management platform while preserving working UI and existing architectural conventions.

Do not treat this repository as a greenfield rewrite.

---

## 2. Repository map

Current top-level responsibilities:

- `app/` — Next.js routes, layouts, route handlers/server entry points
- `components/` — reusable UI components
- `lib/` — domain logic, data access helpers, services, validation and shared utilities according to existing conventions
- `prisma/schema.prisma` — database schema
- `prisma/migrations/` — schema migrations
- `prisma/seed.ts` — development/test seed data only
- `e2e/` — Playwright E2E tests
- `emails/` — email templates/workflows already present
- `types/` — shared TypeScript types when not colocated
- `auth.ts` — existing authentication configuration/entry point

Do not invent new top-level directories until you have inspected the repository and can justify why an existing location is insufficient.

---

## 3. First actions in every feature task

Before editing:

1. Read the relevant `SPEC.md` section.
2. Search the repository for the feature, routes, models and components already involved.
3. Read `prisma/schema.prisma` before changing persistence.
4. Read `auth.ts` and existing auth helpers before changing auth/roles.
5. Inspect existing tests before introducing a new testing pattern.
6. Identify hardcoded/demo behavior that the feature currently relies on.
7. Produce a short implementation plan when the change crosses multiple layers.

Never assume a package, database provider, auth library, payment provider, storage service or email provider without inspecting the project.

---

## 4. Preserve-before-rewrite rule

Prefer:
- wiring existing components to real data
- extracting reusable logic
- extending existing Prisma models
- fixing existing routes
- replacing fake state with real queries/mutations

Avoid:
- rebuilding an already-working page from scratch
- adding duplicate models/services
- introducing a second auth pattern
- creating parallel API and server-action implementations for the same domain operation
- renaming broad areas of the project without a strong reason

If a rewrite is truly necessary, explain why the current implementation cannot be safely extended.

---

## 5. Business-data rule

Never ship fake production business data as fallback content.

Prohibited production fallbacks include fake:
- students
- programs/enrollments
- classes/instructors
- assignments
- grades/results
- payments/cards/subscriptions
- study hours/progress
- attendance
- announcements

If no record exists, render a truthful empty state.

Demo data belongs only in explicit seeds/fixtures/test helpers.

---

## 6. Authentication and authorization

Authentication answers who the user is. Authorization answers what the user may do.

Rules:
- server-side authorization is mandatory for every protected mutation and protected data read
- never trust role, user ID, enrollment ID or resource ownership from the client
- no public admin registration
- account creation does not imply enrollment
- students may have multiple enrollments
- check both resource existence and actor access
- protect against cross-student IDOR

When implementing a protected feature, use the `protect-route` skill and request security review for meaningful authorization changes.

---

## 7. Data-access and domain rules

Preferred flow:

`route/page/component -> server action/handler -> domain/service/data layer -> Prisma`

Follow current repository conventions rather than forcing exact layers where the codebase is intentionally simpler.

Rules:
- validate server-side inputs
- centralize repeated business logic
- avoid Prisma queries duplicated across many components
- select only required fields for sensitive/large records
- use transactions where a multi-write invariant genuinely requires them and provider supports the intended semantics
- design indexes around actual query patterns
- preserve historical academic/financial data where deletion would be destructive

---

## 8. Prisma changes

Before editing schema:

1. inspect existing models and naming
2. inspect database provider
3. check whether an equivalent relation already exists
4. identify migration impact
5. consider existing seed/test data
6. consider old records/nullability/backfill

After schema changes run the repository's actual Prisma generation/migration workflow.

Do not blindly run destructive reset commands against an unknown database.

Use the `design-prisma-schema` skill for non-trivial schema changes.

---

## 9. Next.js server/client boundaries

Prefer server-side data access for protected initial data where compatible with the current app.

Do not add `'use client'` simply to make data fetching easier.

Use client components when browser interaction/state genuinely requires them.

Avoid request waterfalls. Fetch independent dashboard data in parallel or through an intentionally aggregated server query.

After mutations, refresh/revalidate only what is necessary using the project's current Next.js pattern.

---

## 10. UI rules

The existing visual language is intentional.

- preserve layout, typography, spacing and component patterns unless SPEC requires change
- reuse current components
- add real empty states instead of fake cards
- every async screen needs loading/error/empty behavior
- every destructive action requires appropriate confirmation
- buttons must perform the advertised action; otherwise remove/disable transparently
- do not leave dead navigation or dummy CTAs

Use `refactor-without-redesign` when migrating existing screens to real data.

---

## 11. Accessibility

For new/changed UI:
- labels for form inputs
- accessible icon buttons
- keyboard-operable controls
- visible focus
- semantic headings
- useful error messaging
- accessible dialogs
- password show/hide labels

Run the `accessibility-audit` skill for auth and substantial UI changes.

---

## 12. Testing and verification

Do not claim completion without verification.

Use the actual scripts in `package.json`; never invent script names if they do not exist.

At minimum, as applicable:
- typecheck / TypeScript compiler
- lint
- unit/integration tests
- Playwright E2E for critical journeys
- production build

Existing Playwright infrastructure is a core project asset. Use it.

High-risk features such as auth, enrollment, grading and attendance require negative tests, not only happy paths.

---

## 13. Security review triggers

Request/use the `security-reviewer` agent when changing:
- authentication/session behavior
- authorization/roles
- admin routes/actions
- enrollment access
- student-owned resources
- file upload
- payment behavior
- OAuth
- attendance QR/token flow
- redirect handling

The reviewer should initially review without silently rewriting the implementation.

---

## 14. Agent workflow

Default multi-layer feature workflow:

1. `architect` — inspect and plan
2. implementation owner:
   - `frontend-engineer`
   - `backend-engineer`
   - `database-engineer` when needed
3. `qa-engineer` — verify behavior/tests
4. `security-reviewer` — for security-sensitive changes
5. `code-reviewer` — final diff/architecture review

Do not invoke every agent for trivial changes. Use the smallest team appropriate to risk and scope.

Agents should not compete by independently rebuilding the same feature.

---

## 15. Skills

Use repository skills for repeatable work:

- `implement-feature`
- `audit-hardcoded-data`
- `refactor-without-redesign`
- `design-prisma-schema`
- `build-server-action`
- `protect-route`
- `write-tests`
- `accessibility-audit`

Skills are procedures, not excuses to skip repository inspection.

---

## 16. Observability

Preserve existing Sentry configuration.

Capture unexpected failures with useful safe context.

Never log or report:
- passwords
- auth secrets/tokens
- raw card data
- OAuth secrets
- sensitive environment variables

Expected validation/auth rejection should not be treated as noisy fatal errors.

---

## 17. Environment/secrets

- `.env.local` is local and must not be committed
- update `.env.example` only with variable names and safe examples/placeholders
- never hardcode secrets
- inspect current environment naming before adding new vars
- fail clearly when required production integrations are missing

---

## 18. Git/diff discipline

Keep changes scoped to the task.

Avoid unrelated formatting churn or mass renames.

Before finalizing:
- inspect `git diff`
- remove debug logs/dead code
- ensure no secrets or generated build artifacts were added
- summarize important schema/config changes

Do not commit unless explicitly asked.

---

## 19. Definition of completion

Before saying a task is complete, answer:

- Does it satisfy `SPEC.md`?
- Is user/business data real or a truthful empty state?
- Are permissions enforced server-side?
- Did I preserve existing UI where appropriate?
- Are loading/error/empty states handled?
- Did I test unauthorized and failure paths when relevant?
- Do lint/types/tests/build pass according to project scripts?
- Did I inspect the final diff?

If any answer is no, the feature is not done or the limitation must be stated explicitly.
## External Tool Usage

Claude may use configured development integrations when they materially improve verification or diagnosis.

### GitHub

Use GitHub for:

- repository history
- issue context
- pull request inspection
- diff review

Do not create or merge pull requests unless requested.

### Browser / Playwright

Use browser automation to verify important user workflows.

Prefer actual interaction over assuming UI behavior from source code alone.

Critical workflows should be tested across appropriate roles.

### Vercel

Use deployment tooling to diagnose:

- failed builds
- runtime deployment failures
- configuration errors

Do not change production configuration without explicit instruction.

### Database

Database tooling may be used against approved development/test environments.

Never:

- reset production
- delete production data
- apply destructive production migrations
- modify production records

without explicit approval.

### Sentry

Use Sentry to investigate runtime errors and correlate errors with relevant source code.

Never expose private user information or secrets in debugging output.

### Figma

When Figma source designs exist, treat them as visual references.

Do not redesign completed UI simply because alternative designs are possible.

## Documentation-First Engineering

For implementation work that depends on external frameworks, libraries, APIs, services, or version-specific behavior, do not rely solely on model knowledge.

Before implementation:

1. inspect the repository to determine the actual dependency and installed version;
2. use the Docs Explorer agent to consult current authoritative documentation;
3. prefer official documentation, official API references, release notes, and migration guides;
4. verify that recommended APIs are compatible with the installed version;
5. identify relevant deprecations or breaking changes;
6. pass actionable findings to the implementation agent.

Documentation research should be proportional to the task.

Do not invoke Docs Explorer unnecessarily for trivial internal changes that do not depend on external technical behavior.