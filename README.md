# ICLP — Learn with Amara

International Center for Language Proficiency: French learning platform with TCF/TEF exam prep, DELF/DALF tracks, student groups, assignments, and payments.

Built with Next.js (App Router), PostgreSQL via Prisma, NextAuth, Stripe, Resend, and Vercel Blob.

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```
2. Copy `.env.example` to `.env.local` and fill in the values (see comments in that file for where to get each one). At minimum for local dev you need a Postgres `DATABASE_URL` and `AUTH_SECRET`.
3. Run migrations and seed demo data:
   ```bash
   npx prisma migrate dev
   npx prisma db seed
   ```
4. Start the dev server:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000).

Seeded accounts: `admin@iclp.com` / `admin1234` (admin) and `demo@iclp.com` / `demo1234` (student).

## Scripts

- `npm run dev` — start the dev server (Turbopack)
- `npm run build` — production build
- `npm run lint` — ESLint
- `npm run test:e2e` — Playwright end-to-end tests (requires the dev server + seeded database)

## Deployment

Deployed on [Vercel](https://vercel.com). Swap `DATABASE_URL` for a [Neon](https://neon.tech) connection string in production, and configure the Stripe/Resend/Blob/Upstash/Sentry environment variables listed in `.env.example` as needed.

**Note on route casing**: this repo is developed on macOS, which has a case-insensitive filesystem — Vercel's build runs on a case-sensitive one. If a build succeeds locally but 404s on routes after deploying, check that every `redirect()`/`router.push()`/`revalidatePath()` string matches the actual folder casing under `app/` exactly (`git ls-files app/` shows the real tracked casing).
