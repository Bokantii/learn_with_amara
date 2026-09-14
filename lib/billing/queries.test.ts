import { describe, it, expect, vi, beforeEach } from 'vitest';

const paymentFindMany = vi.fn();
const enrollmentFindMany = vi.fn();
const userCount = vi.fn();

vi.mock('../prisma', () => ({
  prisma: {
    payment: { findMany: (...a: unknown[]) => paymentFindMany(...a) },
    enrollment: { findMany: (...a: unknown[]) => enrollmentFindMany(...a) },
    user: { count: (...a: unknown[]) => userCount(...a) },
  },
}));

import { getStudentBilling, getPaymentsOverview, getAdminPaymentsByStudent } from './queries';

const rawPayment = (over: Partial<Record<string, unknown>> = {}) => ({
  id: 'p1',
  amountCents: 30000,
  currency: 'cad',
  status: 'PAID',
  source: 'MANUAL',
  method: 'Bank transfer',
  reference: 'REF-1',
  stripePaymentId: null,
  paidAt: new Date('2026-01-14'),
  createdAt: new Date('2026-01-14'),
  program: null,
  enrollment: { status: 'ACTIVE', program: { name: 'TCF Exam Preparation' } },
  ...over,
});

beforeEach(() => {
  vi.clearAllMocks();
  enrollmentFindMany.mockResolvedValue([]);
});

describe('getStudentBilling', () => {
  it('scopes both reads to the given userId', async () => {
    paymentFindMany.mockResolvedValue([]);
    await getStudentBilling('u_aisha');
    expect(paymentFindMany.mock.calls[0][0].where).toEqual({ userId: 'u_aisha' });
    expect(enrollmentFindMany.mock.calls[0][0].where).toEqual({ userId: 'u_aisha' });
  });

  it('is empty when the student has no payments', async () => {
    paymentFindMany.mockResolvedValue([]);
    const r = await getStudentBilling('u_x');
    expect(r.isEmpty).toBe(true);
    expect(r.payments).toEqual([]);
  });

  it('resolves the program name from the direct relation, then the enrollment', async () => {
    paymentFindMany.mockResolvedValue([
      rawPayment({ id: 'a', program: { name: 'DELF/DALF Track' }, enrollment: null }),
      rawPayment({ id: 'b', program: null, enrollment: { status: 'PAUSED', program: { name: 'From enrollment' } } }),
      rawPayment({ id: 'c', program: null, enrollment: null }),
    ]);
    const r = await getStudentBilling('u');
    expect(r.payments.map((p) => p.programName)).toEqual([
      'DELF/DALF Track',
      'From enrollment',
      null,
    ]);
    expect(r.payments[1].enrollmentStatus).toBe('PAUSED');
  });

  it('surfaces the enrollments summary independently of payments (multi-enrolment)', async () => {
    paymentFindMany.mockResolvedValue([rawPayment()]);
    enrollmentFindMany.mockResolvedValue([
      { status: 'ACTIVE', joinedAt: new Date('2026-01-01'), endedAt: null, program: { name: 'A' } },
      { status: 'COMPLETED', joinedAt: new Date('2025-06-01'), endedAt: new Date('2025-12-01'), program: { name: 'B' } },
    ]);
    const r = await getStudentBilling('u');
    expect(r.enrollments).toEqual([
      { programName: 'A', status: 'ACTIVE', joinedAt: new Date('2026-01-01'), endedAt: null },
      { programName: 'B', status: 'COMPLETED', joinedAt: new Date('2025-06-01'), endedAt: new Date('2025-12-01') },
    ]);
    expect(r.isEmpty).toBe(false);
  });
});

const now = new Date();
const thisMonth = (day: number) => new Date(now.getFullYear(), now.getMonth(), day);
const overviewPayment = (over: Partial<Record<string, unknown>> = {}) => ({
  ...rawPayment(),
  recordedBy: null,
  user: { name: 'Aisha', email: 'aisha@example.com' },
  ...over,
});

describe('getPaymentsOverview', () => {
  beforeEach(() => userCount.mockResolvedValue(3));

  it('keeps this-month revenue per currency and never sums across currencies', async () => {
    paymentFindMany.mockResolvedValue([
      overviewPayment({ id: 'a', currency: 'cad', amountCents: 30000, paidAt: thisMonth(2) }),
      overviewPayment({ id: 'b', currency: 'cad', amountCents: 20000, paidAt: thisMonth(9), user: { name: 'B', email: 'b@x.com' } }),
      overviewPayment({ id: 'c', currency: 'usd', amountCents: 15000, paidAt: thisMonth(4), user: { name: 'C', email: 'c@x.com' } }),
    ]);
    const o = await getPaymentsOverview();
    expect(o.thisMonthByCurrency).toEqual([
      { currency: 'cad', cents: 50000 },
      { currency: 'usd', cents: 15000 },
    ]);
    expect(o.primaryCurrency).toBe('cad'); // largest total volume
  });

  it('counts only PAID payments and distinct paying students', async () => {
    paymentFindMany.mockResolvedValue([
      overviewPayment({ id: 'a', status: 'PAID', paidAt: thisMonth(1), user: { name: 'A', email: 'a@x.com' } }),
      overviewPayment({ id: 'b', status: 'PAID', paidAt: thisMonth(2), user: { name: 'A', email: 'a@x.com' } }),
      overviewPayment({ id: 'c', status: 'REFUNDED', paidAt: thisMonth(3), amountCents: 99999, user: { name: 'R', email: 'r@x.com' } }),
    ]);
    const o = await getPaymentsOverview();
    expect(o.payingStudentCount).toBe(1); // a@x.com only; refunded row excluded
    expect(o.thisMonthByCurrency.reduce((s, c) => s + c.cents, 0)).toBe(60000); // no 99999
  });

  it('is an empty-but-valid shape with no payments', async () => {
    paymentFindMany.mockResolvedValue([]);
    const o = await getPaymentsOverview();
    expect(o.thisMonthByCurrency).toEqual([]);
    expect(o.primaryCurrency).toBeNull();
    expect(o.monthlySeries).toHaveLength(6);
    expect(o.payingStudentCount).toBe(0);
  });
});

describe('getAdminPaymentsByStudent', () => {
  it('groups every payment under its student id', async () => {
    paymentFindMany.mockResolvedValue([
      { ...rawPayment(), id: 'p1', userId: 'u1', recordedBy: { name: 'Admin' } },
      { ...rawPayment(), id: 'p2', userId: 'u1', recordedBy: null },
      { ...rawPayment(), id: 'p3', userId: 'u2', recordedBy: { name: 'Admin' } },
    ]);
    const byStudent = await getAdminPaymentsByStudent();
    expect(byStudent.get('u1')?.map((p) => p.id)).toEqual(['p1', 'p2']);
    expect(byStudent.get('u1')?.[0].recordedByName).toBe('Admin');
    expect(byStudent.get('u2')?.map((p) => p.id)).toEqual(['p3']);
    expect(byStudent.has('u3')).toBe(false);
  });
});
