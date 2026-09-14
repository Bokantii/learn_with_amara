# V1 Launch Gate

Phase 2 (Tasks 1–11) is feature-complete. This is the checklist to take a fresh production
environment from empty to "an admin can sign in and start onboarding real students." It is
**not** a product-feature list — see `SPEC.md` § Known Deferred Issues for what's intentionally
still ahead (instructor portal, Stripe↔enrollment auto-linking, per-student detail page, etc.).

Run the sections in order.

## 1. Environment variables

Every variable the code reads is declared and documented in `.env.example` — copy it to
`.env.local` for local dev, or set the equivalents in your hosting platform's environment
settings for production. Split by whether the app is usable without it:

**Required to launch** — without these, a core student/admin flow is broken, not just degraded:

| Variable | Breaks without it |
|---|---|
| `AUTH_SECRET` | Sign-in doesn't work at all (NextAuth requirement) |
| `DATABASE_URL` | Nothing works |
| `BLOB_READ_WRITE_TOKEN` | Assignment file submission throws |
| `RESEND_API_KEY` + `EMAIL_FROM` (verified domain) | Invites, password resets, grade/class notifications never send |
| `NEXT_PUBLIC_APP_URL` | Required in production (the app throws rather than trust forwarded headers); every emailed invite/reset link and the attendance QR URL depend on it |
| `CRON_SECRET` | Live-class reminders never fire (the cron route fails closed without it — see §3 below) |

**Optional / accepted-as-deferred for V1** — the app degrades safely without these, not broken:

| Variable | Behavior when unset |
|---|---|
| `AUTH_GOOGLE_ID`/`_SECRET`, `AUTH_FACEBOOK_ID`/`_SECRET` | OAuth sign-in buttons still render (SPEC §5.3 flags this as deferred — hiding them when unconfigured is its own follow-up, not part of this gate); credentials sign-in is unaffected |
| `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` | `/checkout` shows a manual-enrollment notice instead of a payment form (Launch Gate item 7 — this is the intended V1 default, not a bug) |
| `UPSTASH_REDIS_REST_URL` / `_TOKEN` | Rate limiting is disabled (fails **open** — every request is allowed) on login, sign-up, password reset and attendance check-in. **Recommendation: configure this before real onboarding** — it's the one "optional" item worth treating as required for anything beyond a small trusted pilot. |
| `SENTRY_DSN` / `NEXT_PUBLIC_SENTRY_DSN` / `SENTRY_ORG` / `SENTRY_PROJECT` / `SENTRY_AUTH_TOKEN` | Sentry is a no-op — no error monitoring, but nothing breaks |

## 2. Fresh production database

Always `prisma migrate deploy` in production — never `migrate dev` or `db push`, both of which
can prompt for destructive resets non-interactively-unsafely.

```bash
DATABASE_URL="<production connection string>" npx prisma migrate deploy
DATABASE_URL="<production connection string>" npx prisma generate
```

Do **not** run `prisma db seed` against production — `prisma/seed.ts` is demo/dev data only
(CLAUDE.md §5: "Demo data belongs only in explicit seeds/fixtures/test helpers"). The production
database starts genuinely empty; the only row it needs is the first admin (§3).

Before pointing this at the real production database for the first time, verify the migration
history itself replays cleanly from zero (it has only ever been applied incrementally onto one
evolving dev database until now): create a throwaway local Postgres database, run the two
commands above against it, confirm `prisma migrate status` reports every migration applied with
no drift, then drop the scratch database.

## 3. First admin account

```bash
ADMIN_NAME="Jane Doe" ADMIN_EMAIL="jane@iclp.com" ADMIN_PASSWORD="a-real-password" npm run create-admin
```

Run once, against the production database (`prisma/create-admin.ts`). Refuses to run without
all three values, refuses to overwrite an existing account, hashes the password the same way the
rest of the app does. Every other staff account (additional admins, instructors) is created from
inside the app afterward: sign in as this admin → `/admin/staff` → Invite Staff.

This is the one command in this runbook that touches a real production credential in plain text
on the command line — it lands in shell history and is visible to other local users via `ps` for
the process's lifetime. Generate the password with a password manager, run the command, then
rotate it immediately via `/reset-password` (the admin role has no dedicated Settings page yet —
`/reset-password` works for any account) — don't reuse that exact string anywhere else, and clear
the relevant shell history entry.

## 4. Payments

Day one ships **manual-only**: `/admin/payments` (already fully real — Task 9) is how the admin
records what a student paid, against whichever enrollment it settles. The public `/checkout`
flow only activates once `STRIPE_SECRET_KEY` is set — until then it shows an honest
"contact us to enroll" notice instead of a payment form. To go live with Stripe later: set
`STRIPE_SECRET_KEY` + `STRIPE_WEBHOOK_SECRET`, add the webhook endpoint
(`https://<domain>/api/stripe/webhook`) in the Stripe dashboard, and keep in mind the payment it
creates still needs an admin to link it to the student's enrollment on `/admin/payments` (Known
Deferred Issue #17 — auto-linking is a later task, not part of this gate).

## 5. Live-class reminders

`.github/workflows/live-class-reminders.yml` already exists and needs no code changes — it's the
scheduler (GitHub Actions calling the app's cron route every 10 minutes; see the workflow's own
header comment for why, versus native Vercel Cron). To activate it:

1. Vercel (or wherever the app is hosted) → set `CRON_SECRET` to a real random value
   (`openssl rand -base64 24`).
2. GitHub repo → Settings → Secrets and variables → Actions → **Secrets** → add `CRON_SECRET`
   with that same value.
3. GitHub repo → Settings → Secrets and variables → Actions → **Variables** → add `APP_URL` set
   to the production origin (e.g. `https://app.iclp.com`).
4. Confirm `RESEND_API_KEY` is set and `EMAIL_FROM` is on a domain verified in Resend — reminders
   (and every other transactional email) silently no-op otherwise (truthful `SKIPPED`, not a
   crash — but nothing is delivered).

The route (`app/api/cron/live-class-reminders/route.ts`) fails closed: with `CRON_SECRET` unset
on either side, every call is rejected rather than accepted.

## 6. Verification before go-live

- `npx tsc --noEmit`, `npm test`, `npm run build` all clean.
- Full `npx playwright test` — no unexplained failures.
- Manual pass, signed in as a real (non-seed) student: `/dashboard` shows real-or-honestly-empty
  data everywhere (no fabricated numbers), `/dashboard/settings` shows only the working Security
  tab, `/checkout` behaves per whichever payments mode is configured.
- `security-reviewer` + `code-reviewer` on the Launch Gate diff.
