import { describe, it, expect } from 'vitest';
import { seedRefusalReason } from './seed-guard';

const LOCAL = 'postgresql://dev:secret@localhost:5432/iclp_dev?schema=public';
const PREVIEW_HOST = 'ep-tiny-silence-24816083.us-east-1.aws.neon.tech';
const PROD_HOST = 'ep-noisy-union-98570409.us-east-1.aws.neon.tech';
const PREVIEW = `postgresql://neondb_owner:s3cr3t-pass@${PREVIEW_HOST}/neondb?sslmode=require`;
const PROD = `postgresql://neondb_owner:s3cr3t-pass@${PROD_HOST}/neondb?sslmode=require`;

describe('seedRefusalReason (prisma/seed.ts production guard, #33e)', () => {
  it('allows a local database', () => {
    expect(seedRefusalReason({ DATABASE_URL: LOCAL })).toBeNull();
    expect(seedRefusalReason({ DATABASE_URL: 'postgresql://u:p@127.0.0.1:5432/db' })).toBeNull();
    expect(seedRefusalReason({ DATABASE_URL: 'postgresql://u:p@[::1]:5432/db' })).toBeNull();
  });

  it('refuses a hosted (non-local) database by default', () => {
    expect(seedRefusalReason({ DATABASE_URL: PREVIEW })).toMatch(/non-local database/);
  });

  it('refuses a host that merely starts with "localhost"', () => {
    expect(seedRefusalReason({ DATABASE_URL: 'postgresql://u:p@localhost.attacker.example/db' })).toMatch(
      /non-local database/
    );
  });

  it('allows a remote database only when SEED_ALLOW_REMOTE names that exact host', () => {
    expect(seedRefusalReason({ DATABASE_URL: PREVIEW, SEED_ALLOW_REMOTE: PREVIEW_HOST })).toBeNull();
    expect(seedRefusalReason({ DATABASE_URL: PREVIEW, SEED_ALLOW_REMOTE: PREVIEW_HOST.toUpperCase() })).toBeNull();
  });

  it('a blanket or mismatched opt-in does not carry over to another database (e.g. production from a laptop)', () => {
    expect(seedRefusalReason({ DATABASE_URL: PROD, SEED_ALLOW_REMOTE: 'true' })).toMatch(/non-local/);
    expect(seedRefusalReason({ DATABASE_URL: PROD, SEED_ALLOW_REMOTE: '1' })).toMatch(/non-local/);
    expect(seedRefusalReason({ DATABASE_URL: PROD, SEED_ALLOW_REMOTE: PREVIEW_HOST })).toMatch(/non-local/);
  });

  it('refuses production even with a matching opt-in, and even against localhost', () => {
    for (const env of [
      { NODE_ENV: 'production', DATABASE_URL: LOCAL },
      { VERCEL_ENV: 'production', DATABASE_URL: LOCAL },
      { NODE_ENV: 'production', DATABASE_URL: PREVIEW, SEED_ALLOW_REMOTE: PREVIEW_HOST },
      { VERCEL_ENV: 'production', DATABASE_URL: PREVIEW, SEED_ALLOW_REMOTE: PREVIEW_HOST },
    ]) {
      expect(seedRefusalReason(env)).toMatch(/production environment/);
    }
  });

  it('refuses a localhost URL whose real host is overridden by a host/hostaddr query parameter', () => {
    const bypasses = [
      `postgresql://u:p@localhost/db?host=${PROD_HOST}`,
      `postgresql://u:p@localhost:5432/db?sslmode=require&host=${PROD_HOST}`,
      'postgresql://u:p@localhost/db?hostaddr=203.0.113.7',
      `postgresql://u:p@localhost/db?HOST=${PROD_HOST}`,
    ];
    for (const url of bypasses) {
      expect(seedRefusalReason({ DATABASE_URL: url })).toMatch(/query parameter/);
    }
    // pg-connection-string (used by the pg driver) resolves the first form's
    // host to PROD_HOST, not localhost; verified manually 2026-11-12.
  });

  it('refuses a URL with no host (the driver would fall back to PGHOST)', () => {
    expect(seedRefusalReason({ DATABASE_URL: 'postgresql:///iclp_dev' })).toMatch(/no host/);
  });

  it('refuses a missing, blank or unparseable DATABASE_URL', () => {
    expect(seedRefusalReason({})).toMatch(/not set/);
    expect(seedRefusalReason({ DATABASE_URL: '   ' })).toMatch(/not set/);
    expect(seedRefusalReason({ DATABASE_URL: 'not a url' })).toMatch(/could not be parsed/);
  });

  it('never includes the connection string or its credentials in the message', () => {
    for (const url of [PROD, `postgresql://neondb_owner:s3cr3t-pass@localhost/db?host=${PROD_HOST}`]) {
      const reason = seedRefusalReason({ DATABASE_URL: url }) ?? '';
      expect(reason).not.toContain('s3cr3t-pass');
      expect(reason).not.toContain('neondb_owner');
      expect(reason).not.toContain('neon.tech');
    }
  });
});
