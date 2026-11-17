import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const notifCreate = vi.fn();
const notifUpdate = vi.fn();
const notifFindUnique = vi.fn();
const resendSend = vi.fn();
const captureException = vi.fn();

vi.mock('../prisma', () => ({
  prisma: {
    notification: {
      create: (...a: unknown[]) => notifCreate(...a),
      update: (...a: unknown[]) => notifUpdate(...a),
      findUnique: (...a: unknown[]) => notifFindUnique(...a),
    },
  },
}));
vi.mock('../email', () => ({
  resend: { emails: { send: (...a: unknown[]) => resendSend(...a) } },
  EMAIL_FROM: 'ICLP <test@resend.dev>',
}));
vi.mock('@sentry/nextjs', () => ({
  captureException: (...a: unknown[]) => captureException(...a),
}));

import { dispatchNotification } from './dispatch';

class PrismaKnownError extends Error {
  code = 'P2002';
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyCall = any;
const DEDUPE_KEY = 'CLASS_REMINDER:lc1:2026-09-01T12:00:00.000Z:u1';

function baseInput(overrides: Record<string, unknown> = {}) {
  return {
    type: 'CLASS_REMINDER' as const,
    relatedEntityType: 'LiveClass',
    relatedEntityId: 'lc1',
    channels: ['IN_APP', 'EMAIL'] as ('IN_APP' | 'EMAIL')[],
    recipients: [
      {
        user: { id: 'u1', name: 'Aisha', email: 'aisha@example.com' },
        dedupeKey: DEDUPE_KEY,
        title: 't',
        message: 'm',
        emailMessage: { subject: 's', react: null as unknown as never },
      },
    ],
    ...overrides,
  };
}

let idCounter = 0;

beforeEach(() => {
  vi.clearAllMocks();
  idCounter = 0;
  process.env.RESEND_API_KEY = 're_test_key';
  notifCreate.mockImplementation(async () => ({ id: `row_${++idCounter}` }));
  notifUpdate.mockResolvedValue({});
  resendSend.mockResolvedValue({ data: { id: 'email_1' }, error: null });
});

afterEach(() => {
  delete process.env.RESEND_API_KEY;
});

describe('dispatchNotification', () => {
  it('fresh dispatch delivers on every channel and passes the dedupe key to Resend', async () => {
    const summary = await dispatchNotification(baseInput());

    expect(summary.channels.IN_APP).toMatchObject({ sent: 1, alreadyHandled: 0 });
    expect(summary.channels.EMAIL).toMatchObject({ sent: 1, failed: 0, skipped: 0 });
    expect(resendSend).toHaveBeenCalledTimes(1);
    expect(resendSend.mock.calls[0][1]).toEqual({ idempotencyKey: DEDUPE_KEY });

    const createdStatuses = notifCreate.mock.calls.map((c: AnyCall) => c[0].data.status);
    // IN_APP row is written already-SENT; EMAIL row is claimed PENDING then updated
    expect(createdStatuses).toEqual(expect.arrayContaining(['SENT', 'PENDING']));
  });

  it('a logical notification already SENT is never delivered again', async () => {
    notifCreate.mockRejectedValue(new PrismaKnownError('unique'));
    notifFindUnique.mockResolvedValue({ id: 'row_x', status: 'SENT', attempts: 0 });

    const summary = await dispatchNotification(baseInput());

    expect(resendSend).not.toHaveBeenCalled();
    expect(summary.channels.EMAIL).toMatchObject({ alreadyHandled: 1, sent: 0 });
    expect(summary.channels.IN_APP).toMatchObject({ alreadyHandled: 1 });
  });

  it('records SKIPPED, not FAILED, when email delivery is not configured', async () => {
    delete process.env.RESEND_API_KEY;

    const summary = await dispatchNotification(baseInput());

    expect(resendSend).not.toHaveBeenCalled();
    expect(summary.channels.EMAIL).toMatchObject({ skipped: 1, failed: 0, sent: 0 });
    const skipUpdate = notifUpdate.mock.calls.find(
      (c: AnyCall) => c[0].data.status === 'SKIPPED'
    );
    expect(skipUpdate).toBeTruthy();
  });

  it('retries a previously FAILED delivery on the same row, then succeeds — no duplicate row', async () => {
    resendSend.mockResolvedValueOnce({ data: null, error: { message: 'temporary provider error' } });
    const first = await dispatchNotification(baseInput({ channels: ['EMAIL'] }));
    expect(first.channels.EMAIL).toMatchObject({ failed: 1 });
    const failUpdate = notifUpdate.mock.calls.find((c: AnyCall) => c[0].data.status === 'FAILED') as AnyCall;
    expect(failUpdate[0].data.attempts).toEqual({ increment: 1 });

    vi.clearAllMocks();
    notifUpdate.mockResolvedValue({});
    notifCreate.mockRejectedValue(new PrismaKnownError('unique'));
    notifFindUnique.mockResolvedValue({ id: 'row_1', status: 'FAILED', attempts: 1 });
    resendSend.mockResolvedValue({ data: { id: 'e' }, error: null });

    const second = await dispatchNotification(baseInput({ channels: ['EMAIL'] }));

    expect(second.channels.EMAIL).toMatchObject({ sent: 1 });
    expect(resendSend).toHaveBeenCalledTimes(1);
    const sentUpdate = notifUpdate.mock.calls.find((c: AnyCall) => c[0].data.status === 'SENT') as AnyCall;
    expect(sentUpdate[0].where).toEqual({ id: 'row_1' });
    expect(notifCreate).toHaveBeenCalledTimes(1); // the failed create attempt only
  });

  it('stops retrying once the attempt budget is exhausted', async () => {
    notifCreate.mockRejectedValue(new PrismaKnownError('unique'));
    notifFindUnique.mockResolvedValue({ id: 'row_1', status: 'FAILED', attempts: 3 });

    const summary = await dispatchNotification(baseInput({ channels: ['EMAIL'] }));

    expect(resendSend).not.toHaveBeenCalled();
    expect(summary.channels.EMAIL).toMatchObject({ alreadyHandled: 1, sent: 0, failed: 0 });
  });

  it('reclaims a stale PENDING row (orphaned by a prior crash) and delivers it', async () => {
    notifCreate.mockRejectedValue(new PrismaKnownError('unique'));
    notifFindUnique.mockResolvedValue({
      id: 'row_1',
      status: 'PENDING',
      attempts: 0,
      updatedAt: new Date(Date.now() - 15 * 60_000), // 15 min old
    });

    const summary = await dispatchNotification(baseInput({ channels: ['EMAIL'] }));

    expect(summary.channels.EMAIL).toMatchObject({ sent: 1 });
    expect(resendSend).toHaveBeenCalledTimes(1);
    const sentUpdate = notifUpdate.mock.calls.find((c: AnyCall) => c[0].data.status === 'SENT') as AnyCall;
    expect(sentUpdate[0].where).toEqual({ id: 'row_1' });
  });

  it('does not touch a fresh PENDING row (another run is mid-flight)', async () => {
    notifCreate.mockRejectedValue(new PrismaKnownError('unique'));
    notifFindUnique.mockResolvedValue({
      id: 'row_1',
      status: 'PENDING',
      attempts: 0,
      updatedAt: new Date(), // just created by the in-flight run
    });

    const summary = await dispatchNotification(baseInput({ channels: ['EMAIL'] }));

    expect(resendSend).not.toHaveBeenCalled();
    expect(summary.channels.EMAIL).toMatchObject({ alreadyHandled: 1, sent: 0 });
  });

  it('one recipient failing does not sink the rest of the batch', async () => {
    const input = baseInput({
      channels: ['EMAIL'],
      recipients: [
        {
          user: { id: 'u1', name: 'A', email: 'a@example.com' },
          dedupeKey: 'k1',
          title: 't',
          message: 'm',
          emailMessage: { subject: 's', react: null as unknown as never },
        },
        {
          user: { id: 'u2', name: 'B', email: 'b@example.com' },
          dedupeKey: 'k2',
          title: 't',
          message: 'm',
          emailMessage: { subject: 's', react: null as unknown as never },
        },
      ],
    });
    resendSend.mockImplementation(async ({ to }: { to: string }) => {
      if (to === 'a@example.com') throw new Error('network down');
      return { data: { id: 'e' }, error: null };
    });

    const summary = await dispatchNotification(input);

    expect(summary.channels.EMAIL).toMatchObject({ sent: 1, failed: 1 });
    expect(captureException).toHaveBeenCalled();
  });
});
