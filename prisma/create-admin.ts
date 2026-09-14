// One-time bootstrap for the very first real admin account on a fresh
// production database (Launch Gate item 6). Not part of `prisma db seed` —
// that stays demo/dev-only data (CLAUDE.md §5).
//
// Usage:
//   ADMIN_NAME="Jane Doe" ADMIN_EMAIL="jane@iclp.com" ADMIN_PASSWORD="..." npm run create-admin
//
// Safe by construction:
//   - refuses to run without all three values, or with a password under 8 chars
//   - refuses to overwrite an existing account with that email (no silent
//     password reset of someone else's account)
//   - hashes the password the same way prisma/seed.ts and the sign-up/invite
//     flows do (bcryptjs, cost 10) — never stores it in plain text
//   - creates the account already ACTIVE (skips the invite/token flow,
//     appropriate for the one account that must exist before any admin does)

import { config } from 'dotenv';
config({ path: '.env.local' }); // no-op if the file doesn't exist (e.g. production, where the host injects env vars directly)

import bcrypt from 'bcryptjs';
import { prisma } from '../lib/prisma';

async function main() {
  const name = process.env.ADMIN_NAME?.trim();
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;

  if (!name || !email || !password) {
    console.error(
      'Missing required environment variables.\n' +
        'Usage: ADMIN_NAME="Jane Doe" ADMIN_EMAIL="jane@iclp.com" ADMIN_PASSWORD="..." npm run create-admin'
    );
    process.exitCode = 1;
    return;
  }
  if (password.length < 8) {
    console.error('ADMIN_PASSWORD must be at least 8 characters.');
    process.exitCode = 1;
    return;
  }

  const existing = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  if (existing) {
    console.error(
      `A user with ${email} already exists (id: ${existing.id}). Refusing to overwrite it — ` +
        'use a different email, or manage that account from /admin/staff.'
    );
    process.exitCode = 1;
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const admin = await prisma.user.create({
    data: { name, email, passwordHash, role: 'ADMIN', status: 'ACTIVE' },
    select: { id: true, email: true },
  });

  console.log(`Created admin ${admin.email} (id: ${admin.id}). Sign in at /SignIn.`);
}

main()
  .catch((err) => {
    console.error('create-admin failed:', err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
