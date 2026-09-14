import { describe, it, expect, vi, beforeEach } from 'vitest';

const userFindUnique = vi.fn();
const userCreate = vi.fn();
const userUpdate = vi.fn();
const userCount = vi.fn();
const userDelete = vi.fn();
const tokenFindUnique = vi.fn();
const tokenCreate = vi.fn();
const tokenUpdateMany = vi.fn();
const tokenDeleteMany = vi.fn();
const sessionDeleteMany = vi.fn();

vi.mock('../prisma', () => {
  const p: Record<string, unknown> = {
    user: {
      findUnique: (...a: unknown[]) => userFindUnique(...a),
      create: (...a: unknown[]) => userCreate(...a),
      update: (...a: unknown[]) => userUpdate(...a),
      count: (...a: unknown[]) => userCount(...a),
      delete: (...a: unknown[]) => userDelete(...a),
    },
    accountToken: {
      findUnique: (...a: unknown[]) => tokenFindUnique(...a),
      create: (...a: unknown[]) => tokenCreate(...a),
      updateMany: (...a: unknown[]) => tokenUpdateMany(...a),
      deleteMany: (...a: unknown[]) => tokenDeleteMany(...a),
    },
    session: { deleteMany: (...a: unknown[]) => sessionDeleteMany(...a) },
    // Handle both the array form (`$transaction([p1, p2])`) and the interactive
    // callback form (`$transaction(async (tx) => …, { isolationLevel })`).
    $transaction: (arg: unknown) =>
      typeof arg === 'function' ? (arg as (tx: unknown) => unknown)(p) : Promise.all(arg as unknown[]),
  };
  return { prisma: p };
});

vi.mock('./token', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./token')>();
  return { ...actual, hashAccountToken: (t: string) => `hash:${t}` };
});

import {
  consumeAccountToken,
  createInvitedUser,
  deactivateUser,
  issuePasswordReset,
  reactivateUser,
  revokeInvite,
} from './lifecycle';

const future = new Date(Date.now() + 60_000);

beforeEach(() => {
  vi.clearAllMocks();
  userCreate.mockResolvedValue({ id: 'u-new' });
  userUpdate.mockResolvedValue({});
  userDelete.mockResolvedValue({});
  tokenCreate.mockResolvedValue({});
  tokenUpdateMany.mockResolvedValue({ count: 1 });
  tokenDeleteMany.mockResolvedValue({ count: 0 });
  sessionDeleteMany.mockResolvedValue({ count: 0 });
});

describe('consumeAccountToken', () => {
  const inviteToken = (over = {}) => ({
    id: 't1', userId: 'u1', purpose: 'INVITE', consumedAt: null, expiresAt: future,
    user: { status: 'INVITED' }, ...over,
  });
  const resetToken = (over = {}) => ({
    id: 't2', userId: 'u2', purpose: 'PASSWORD_RESET', consumedAt: null, expiresAt: future,
    user: { status: 'ACTIVE' }, ...over,
  });

  it('rejects a missing token', async () => {
    tokenFindUnique.mockResolvedValue(null);
    await expect(consumeAccountToken('nope', 'hash')).rejects.toThrow(/invalid or has expired/i);
    expect(userUpdate).not.toHaveBeenCalled();
  });

  it('rejects an already-consumed token', async () => {
    tokenFindUnique.mockResolvedValue(inviteToken({ consumedAt: new Date() }));
    await expect(consumeAccountToken('raw', 'hash')).rejects.toThrow();
    expect(userUpdate).not.toHaveBeenCalled();
  });

  it('rejects an expired token', async () => {
    tokenFindUnique.mockResolvedValue(inviteToken({ expiresAt: new Date(Date.now() - 1000) }));
    await expect(consumeAccountToken('raw', 'hash')).rejects.toThrow();
  });

  it('rejects a purpose mismatch before any write', async () => {
    tokenFindUnique.mockResolvedValue(resetToken());
    await expect(consumeAccountToken('raw', 'hash', 'INVITE')).rejects.toThrow();
    expect(userUpdate).not.toHaveBeenCalled();
    expect(tokenUpdateMany).not.toHaveBeenCalled();
  });

  it('rejects an INVITE link whose account is no longer INVITED (already activated or archived)', async () => {
    tokenFindUnique.mockResolvedValue(inviteToken({ user: { status: 'ACTIVE' } }));
    await expect(consumeAccountToken('raw', 'hash', 'INVITE')).rejects.toThrow();
    tokenFindUnique.mockResolvedValue(inviteToken({ user: { status: 'DEACTIVATED' } }));
    await expect(consumeAccountToken('raw', 'hash', 'INVITE')).rejects.toThrow();
    expect(userUpdate).not.toHaveBeenCalled();
  });

  it('rejects a PASSWORD_RESET link whose account is no longer ACTIVE (archived since issue)', async () => {
    tokenFindUnique.mockResolvedValue(resetToken({ user: { status: 'DEACTIVATED' } }));
    await expect(consumeAccountToken('raw', 'hash', 'PASSWORD_RESET')).rejects.toThrow();
    expect(userUpdate).not.toHaveBeenCalled();
  });

  it('rejects when the atomic claim loses the race (concurrent double-submit)', async () => {
    tokenFindUnique.mockResolvedValue(inviteToken());
    tokenUpdateMany.mockResolvedValue({ count: 0 });
    await expect(consumeAccountToken('raw', 'hash', 'INVITE')).rejects.toThrow();
    expect(userUpdate).not.toHaveBeenCalled();
  });

  it('activates the account, stamps passwordChangedAt and spends the token for a valid INVITE', async () => {
    tokenFindUnique.mockResolvedValue(inviteToken());
    const res = await consumeAccountToken('raw', 'newhash', 'INVITE');
    expect(res).toEqual({ userId: 'u1', purpose: 'INVITE' });
    expect(tokenUpdateMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 't1', consumedAt: null } })
    );
    const data = userUpdate.mock.calls[0][0].data;
    expect(data).toEqual(
      expect.objectContaining({ passwordHash: 'newhash', status: 'ACTIVE' })
    );
    expect(data.emailVerified).toBeInstanceOf(Date);
    expect(data.passwordChangedAt).toBeInstanceOf(Date);
    expect(tokenDeleteMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ userId: 'u1', purpose: 'INVITE' }) })
    );
    expect(sessionDeleteMany).toHaveBeenCalledWith({ where: { userId: 'u1' } });
  });

  it('sets password + passwordChangedAt (no status change) for a valid PASSWORD_RESET', async () => {
    tokenFindUnique.mockResolvedValue(resetToken());
    await consumeAccountToken('raw', 'newhash', 'PASSWORD_RESET');
    const data = userUpdate.mock.calls[0][0].data;
    expect(data.passwordHash).toBe('newhash');
    expect(data.passwordChangedAt).toBeInstanceOf(Date);
    expect(data.status).toBeUndefined();
    expect(data.emailVerified).toBeUndefined();
    expect(sessionDeleteMany).toHaveBeenCalledWith({ where: { userId: 'u2' } });
  });
});

describe('issuePasswordReset (no account enumeration)', () => {
  it('returns an empty result and mints no token for an unknown email', async () => {
    userFindUnique.mockResolvedValue(null);
    expect(await issuePasswordReset('ghost@example.com')).toEqual({});
    expect(tokenCreate).not.toHaveBeenCalled();
  });

  it('returns an empty result for a non-ACTIVE account', async () => {
    userFindUnique.mockResolvedValue({
      id: 'u1', name: 'A', email: 'a@x.com', status: 'DEACTIVATED', passwordHash: 'h',
    });
    expect(await issuePasswordReset('a@x.com')).toEqual({});
    expect(tokenCreate).not.toHaveBeenCalled();
  });

  it('returns an empty result for an INVITED account', async () => {
    userFindUnique.mockResolvedValue({
      id: 'u1', name: 'A', email: 'a@x.com', status: 'INVITED', passwordHash: null,
    });
    expect(await issuePasswordReset('a@x.com')).toEqual({});
    expect(tokenCreate).not.toHaveBeenCalled();
  });

  it('issues a token for an ACTIVE, password-backed account', async () => {
    userFindUnique.mockResolvedValue({
      id: 'u1', name: 'Ada', email: 'ada@x.com', status: 'ACTIVE', passwordHash: 'h',
    });
    const res = await issuePasswordReset('ada@x.com');
    expect(res.rawToken).toBeTruthy();
    expect(res.recipient).toEqual({ name: 'Ada', email: 'ada@x.com' });
    expect(tokenCreate).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ purpose: 'PASSWORD_RESET' }) })
    );
  });
});

describe('createInvitedUser', () => {
  it('rejects a duplicate email', async () => {
    userFindUnique.mockResolvedValue({ id: 'existing' });
    await expect(
      createInvitedUser({ name: 'X', email: 'x@x.com', role: 'STUDENT' })
    ).rejects.toThrow(/already exists/i);
  });

  it('creates an INVITED user with a PENDING enrollment when a program is given', async () => {
    userFindUnique.mockResolvedValue(null);
    await createInvitedUser({ name: 'New Kid', email: 'NEW@x.com', role: 'STUDENT', programId: 'p1' });
    const data = userCreate.mock.calls[0][0].data;
    expect(data.email).toBe('new@x.com');
    expect(data.status).toBe('INVITED');
    expect(data.passwordHash).toBeNull();
    expect(data.enrollments.create).toEqual({ programId: 'p1', status: 'PENDING' });
    expect(tokenCreate).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ purpose: 'INVITE' }) })
    );
  });
});

describe('deactivateUser', () => {
  it('refuses to deactivate your own account', async () => {
    await expect(deactivateUser('me', 'me')).rejects.toThrow(/your own account/i);
    expect(userUpdate).not.toHaveBeenCalled();
  });

  it('refuses to deactivate an INVITED (never-activated) account', async () => {
    userFindUnique.mockResolvedValue({ role: 'INSTRUCTOR', status: 'INVITED' });
    await expect(deactivateUser('u1', 'admin1')).rejects.toThrow(/not been activated/i);
    expect(userUpdate).not.toHaveBeenCalled();
  });

  it('refuses to deactivate the last active admin (checked inside the transaction)', async () => {
    userFindUnique.mockResolvedValue({ role: 'ADMIN', status: 'ACTIVE' });
    userCount.mockResolvedValue(1);
    await expect(deactivateUser('admin1', 'admin2')).rejects.toThrow(/last active admin/i);
    expect(userUpdate).not.toHaveBeenCalled();
  });

  it('archives the account, revokes its tokens + sessions, touches no history models', async () => {
    userFindUnique.mockResolvedValue({ role: 'STUDENT', status: 'ACTIVE' });
    await deactivateUser('s1', 'admin1');
    expect(userUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 's1' },
        data: expect.objectContaining({ status: 'DEACTIVATED', deactivatedById: 'admin1' }),
      })
    );
    expect(userUpdate.mock.calls[0][0].data.deactivatedAt).toBeInstanceOf(Date);
    expect(sessionDeleteMany).toHaveBeenCalledWith({ where: { userId: 's1' } });
    expect(tokenDeleteMany).toHaveBeenCalledWith({ where: { userId: 's1' } });
    // never touches an enrollment / submission / payment model
  });

  it('is a no-op when the account is already deactivated', async () => {
    userFindUnique.mockResolvedValue({ role: 'STUDENT', status: 'DEACTIVATED' });
    await deactivateUser('s1', 'admin1');
    expect(userUpdate).not.toHaveBeenCalled();
    expect(sessionDeleteMany).not.toHaveBeenCalled();
  });
});

describe('revokeInvite', () => {
  it('hard-deletes an INVITED stub', async () => {
    userFindUnique.mockResolvedValue({ status: 'INVITED' });
    await revokeInvite('u1');
    expect(userDelete).toHaveBeenCalledWith({ where: { id: 'u1' } });
  });

  it('refuses an already-activated account', async () => {
    userFindUnique.mockResolvedValue({ status: 'ACTIVE' });
    await expect(revokeInvite('u1')).rejects.toThrow(/already been activated/i);
    expect(userDelete).not.toHaveBeenCalled();
  });
});

describe('reactivateUser', () => {
  it('is a no-op for an account that is not deactivated', async () => {
    userFindUnique.mockResolvedValue({ status: 'ACTIVE', passwordHash: 'h' });
    await reactivateUser('u1');
    expect(userUpdate).not.toHaveBeenCalled();
  });

  it('refuses a never-activated (password-less) account', async () => {
    userFindUnique.mockResolvedValue({ status: 'DEACTIVATED', passwordHash: null });
    await expect(reactivateUser('u1')).rejects.toThrow(/never activated/i);
  });

  it('restores a deactivated account and clears the audit fields', async () => {
    userFindUnique.mockResolvedValue({ status: 'DEACTIVATED', passwordHash: 'h' });
    await reactivateUser('u1');
    expect(userUpdate).toHaveBeenCalledWith({
      where: { id: 'u1' },
      data: { status: 'ACTIVE', deactivatedAt: null, deactivatedById: null },
    });
  });
});
