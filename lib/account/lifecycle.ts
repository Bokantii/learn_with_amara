import type { AccountTokenPurpose, Role } from '../generated/prisma/client';
import { prisma } from '../prisma';
import { ActionError } from '../action-error';
import { INVITE_TTL_MS, RESET_TTL_MS, canSignIn } from './status';
import { generateAccountToken, hashAccountToken } from './token';

export { INVITE_TTL_MS, RESET_TTL_MS, canSignIn };

/**
 * Account lifecycle — the single source of truth for invite / activation /
 * password-reset and deactivate / reactivate (SPEC §4.5 / §5 / §11.2, Phase 2
 * Task 11).
 *
 * Invariants enforced here, not in the callers:
 *  - tokens are single-use, hashed at rest, and expire (`INVITE_TTL_MS` /
 *    `RESET_TTL_MS`);
 *  - `issuePasswordReset` never reveals whether an email is registered;
 *  - deactivation flips `User.status` + audit fields ONLY — it never deletes an
 *    enrollment, submission, grade, payment, attendance or notification row;
 *  - an admin cannot deactivate their own account or the last active admin.
 */

async function mintToken(userId: string, purpose: AccountTokenPurpose, ttlMs: number) {
  const { rawToken, tokenHash } = generateAccountToken();
  // One live token per (user, purpose): drop any earlier unconsumed one so a
  // re-issue immediately invalidates the previous link.
  await prisma.$transaction([
    prisma.accountToken.deleteMany({ where: { userId, purpose, consumedAt: null } }),
    prisma.accountToken.create({
      data: { userId, purpose, tokenHash, expiresAt: new Date(Date.now() + ttlMs) },
    }),
  ]);
  return rawToken;
}

interface CreateInvitedUserInput {
  name: string;
  email: string;
  role: Role;
  /** When provided (students), the user gets a PENDING enrollment in this program. */
  programId?: string;
}

/**
 * Provision a not-yet-usable account (`status: INVITED`, no password) plus a
 * fresh INVITE token. Returns the raw token so the caller can email — or, when
 * email is unconfigured, surface — the activation link.
 */
export async function createInvitedUser(
  input: CreateInvitedUserInput
): Promise<{ userId: string; rawToken: string }> {
  const email = input.email.trim().toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  if (existing) {
    throw new ActionError('A user with that email already exists.');
  }

  const user = await prisma.user.create({
    data: {
      name: input.name.trim(),
      email,
      role: input.role,
      status: 'INVITED',
      passwordHash: null,
      ...(input.programId
        ? { enrollments: { create: { programId: input.programId, status: 'PENDING' } } }
        : {}),
    },
    select: { id: true },
  });

  const rawToken = await mintToken(user.id, 'INVITE', INVITE_TTL_MS);
  return { userId: user.id, rawToken };
}

/** Re-issue an INVITE link for an account that is still awaiting activation. */
export async function issueInvite(userId: string): Promise<{ rawToken: string }> {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { status: true } });
  if (!user) throw new ActionError('That account could not be found.');
  if (user.status !== 'INVITED') {
    throw new ActionError('This account has already been activated.');
  }
  const rawToken = await mintToken(userId, 'INVITE', INVITE_TTL_MS);
  return { rawToken };
}

/**
 * Start a password reset. Always resolves the same shape regardless of whether
 * the email is registered (no account enumeration). `rawToken` / `recipient`
 * are present only when a real, ACTIVE, password-backed account matched — the
 * caller emails the link only then.
 */
export async function issuePasswordReset(email: string): Promise<{
  rawToken?: string;
  recipient?: { name: string; email: string };
}> {
  const normalized = email.trim().toLowerCase();
  const user = await prisma.user.findUnique({
    where: { email: normalized },
    select: { id: true, name: true, email: true, status: true, passwordHash: true },
  });
  if (!user || user.status !== 'ACTIVE' || !user.passwordHash) {
    return {};
  }
  const rawToken = await mintToken(user.id, 'PASSWORD_RESET', RESET_TTL_MS);
  return { rawToken, recipient: { name: user.name, email: user.email } };
}

/** Read-only lookup for the invite-accept page (greet by name). */
export async function resolveInviteToken(
  rawToken: string
): Promise<{ email: string; name: string } | null> {
  const token = await prisma.accountToken.findUnique({
    where: { tokenHash: hashAccountToken(rawToken) },
    select: { purpose: true, consumedAt: true, expiresAt: true, user: { select: { name: true, email: true } } },
  });
  if (!token || token.purpose !== 'INVITE' || token.consumedAt || token.expiresAt < new Date()) {
    return null;
  }
  return { email: token.user.email, name: token.user.name };
}

/**
 * Consume an INVITE or PASSWORD_RESET token and set the account's password.
 * Rejects a missing / already-used / expired token. For an INVITE this also
 * flips the account to ACTIVE and marks the email verified. Single-use: the
 * token — and any sibling of the same purpose — is spent in the same write.
 */
export async function consumeAccountToken(
  rawToken: string,
  newPasswordHash: string,
  expectedPurpose?: AccountTokenPurpose
): Promise<{ userId: string; purpose: AccountTokenPurpose }> {
  const token = await prisma.accountToken.findUnique({
    where: { tokenHash: hashAccountToken(rawToken) },
    select: {
      id: true,
      userId: true,
      purpose: true,
      consumedAt: true,
      expiresAt: true,
      user: { select: { status: true } },
    },
  });
  // Purpose mismatch is checked BEFORE any write so a reset token submitted to
  // the invite endpoint (or vice-versa) is rejected without being spent. The
  // target's current status is checked too: an INVITE link only activates an
  // account that is still INVITED (not one already activated or since archived),
  // and a PASSWORD_RESET link only rewrites an ACTIVE account — so archiving an
  // account can never be undone by a link issued before the archive.
  if (
    !token ||
    token.consumedAt ||
    token.expiresAt < new Date() ||
    (expectedPurpose && token.purpose !== expectedPurpose) ||
    (token.purpose === 'INVITE' && token.user.status !== 'INVITED') ||
    (token.purpose === 'PASSWORD_RESET' && token.user.status !== 'ACTIVE')
  ) {
    throw new ActionError('This link is invalid or has expired. Request a new one.');
  }

  await prisma.$transaction(async (tx) => {
    // Atomic claim: a concurrent double-submit of the same link updates 0 rows
    // on the second call and is rejected instead of setting the password twice.
    const claimed = await tx.accountToken.updateMany({
      where: { id: token.id, consumedAt: null },
      data: { consumedAt: new Date() },
    });
    if (claimed.count === 0) {
      throw new ActionError('This link is invalid or has expired. Request a new one.');
    }
    const now = new Date();
    await tx.user.update({
      where: { id: token.userId },
      data: {
        passwordHash: newPasswordHash,
        passwordChangedAt: now,
        ...(token.purpose === 'INVITE' ? { status: 'ACTIVE', emailVerified: now } : {}),
      },
    });
    await tx.accountToken.deleteMany({
      where: { userId: token.userId, purpose: token.purpose, consumedAt: null, id: { not: token.id } },
    });
    // A reset evicts any session it was meant to lock out (also enforced by the
    // getSessionUser `passwordChangedAt` check for stateless JWTs).
    await tx.session.deleteMany({ where: { userId: token.userId } });
  });

  return { userId: token.userId, purpose: token.purpose };
}

/**
 * Archive an account: it can no longer sign in, but every enrollment,
 * submission, grade, payment, attendance and notification row is left exactly
 * as it was so the record — and a later reactivation — is intact.
 */
export async function deactivateUser(userId: string, byId: string): Promise<void> {
  if (userId === byId) {
    throw new ActionError('You cannot deactivate your own account.');
  }
  const target = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true, status: true },
  });
  if (!target) throw new ActionError('That account could not be found.');
  if (target.status === 'DEACTIVATED') return; // idempotent
  if (target.status === 'INVITED') {
    // A never-activated account has nothing to archive — revoke the invite instead.
    throw new ActionError('This account has not been activated yet. Revoke the invite instead.');
  }

  // Serializable so two admins concurrently archiving the two remaining admins
  // can't both pass the "last active admin" check.
  await prisma.$transaction(
    async (tx) => {
      if (target.role === 'ADMIN') {
        const activeAdmins = await tx.user.count({
          where: { role: 'ADMIN', status: 'ACTIVE' },
        });
        if (activeAdmins <= 1) {
          throw new ActionError('Cannot deactivate the last active admin.');
        }
      }
      await tx.user.update({
        where: { id: userId },
        data: { status: 'DEACTIVATED', deactivatedAt: new Date(), deactivatedById: byId },
      });
      // Revoke any outstanding invite / reset link so an archive can't be
      // undone by a link issued before it, and drop live sessions (defensive —
      // JWT sessions also stop working via the getSessionUser gate).
      await tx.session.deleteMany({ where: { userId } });
      await tx.accountToken.deleteMany({ where: { userId } });
    },
    { isolationLevel: 'Serializable' }
  );
}

/**
 * Permanently remove a never-activated invited stub (no password, no session,
 * no academic/financial history — it could not have accrued any). Cascades take
 * its pending enrollment and outstanding token with it.
 */
export async function revokeInvite(userId: string): Promise<void> {
  const target = await prisma.user.findUnique({
    where: { id: userId },
    select: { status: true },
  });
  if (!target) throw new ActionError('That account could not be found.');
  if (target.status !== 'INVITED') {
    throw new ActionError('This account has already been activated — deactivate it instead.');
  }
  await prisma.user.delete({ where: { id: userId } });
}

/** Restore an archived account to ACTIVE. Not for INVITED accounts — those must
 *  re-run the invite (they never had a password). */
export async function reactivateUser(userId: string): Promise<void> {
  const target = await prisma.user.findUnique({
    where: { id: userId },
    select: { status: true, passwordHash: true },
  });
  if (!target) throw new ActionError('That account could not be found.');
  if (target.status !== 'DEACTIVATED') return; // idempotent
  if (!target.passwordHash) {
    throw new ActionError('This account was never activated — resend the invite instead.');
  }

  await prisma.user.update({
    where: { id: userId },
    data: { status: 'ACTIVE', deactivatedAt: null, deactivatedById: null },
  });
}
