import type { EnrollmentStatus, PaymentSource, PaymentStatus } from '../generated/prisma/client';
import { prisma } from '../prisma';

/**
 * Server-side reads for the billing surfaces (SPEC §10.9, §11.12). Every query
 * is scoped to a `userId` / `studentId` the caller resolved from the session or
 * an admin route — no identifier is taken from the client, and there is no
 * per-payment id route, so financial history is never exposed by a guessable id.
 */

export interface StudentPaymentRow {
  id: string;
  amountCents: number;
  currency: string;
  status: PaymentStatus;
  source: PaymentSource;
  method: string | null;
  reference: string | null;
  stripePaymentId: string | null;
  paidAt: Date | null;
  createdAt: Date;
  programName: string | null;
  enrollmentStatus: EnrollmentStatus | null;
}

export interface StudentEnrollmentRow {
  programName: string;
  status: EnrollmentStatus;
  joinedAt: Date;
  endedAt: Date | null;
}

export interface StudentBilling {
  payments: StudentPaymentRow[];
  enrollments: StudentEnrollmentRow[];
  isEmpty: boolean;
}

const PAYMENT_SELECT = {
  id: true,
  amountCents: true,
  currency: true,
  status: true,
  source: true,
  method: true,
  reference: true,
  stripePaymentId: true,
  paidAt: true,
  createdAt: true,
  program: { select: { name: true } },
  enrollment: { select: { status: true, program: { select: { name: true } } } },
} as const;

type RawPayment = {
  id: string;
  amountCents: number;
  currency: string;
  status: PaymentStatus;
  source: PaymentSource;
  method: string | null;
  reference: string | null;
  stripePaymentId: string | null;
  paidAt: Date | null;
  createdAt: Date;
  program: { name: string } | null;
  enrollment: { status: EnrollmentStatus; program: { name: string } } | null;
};

function toRow(p: RawPayment): StudentPaymentRow {
  return {
    id: p.id,
    amountCents: p.amountCents,
    currency: p.currency,
    status: p.status,
    source: p.source,
    method: p.method,
    reference: p.reference,
    stripePaymentId: p.stripePaymentId,
    paidAt: p.paidAt,
    createdAt: p.createdAt,
    programName: p.program?.name ?? p.enrollment?.program.name ?? null,
    enrollmentStatus: p.enrollment?.status ?? null,
  };
}

/** The signed-in student's own billing. */
export async function getStudentBilling(userId: string): Promise<StudentBilling> {
  const [payments, enrollments] = await Promise.all([
    prisma.payment.findMany({
      where: { userId },
      orderBy: [{ paidAt: 'desc' }, { createdAt: 'desc' }],
      select: PAYMENT_SELECT,
    }),
    prisma.enrollment.findMany({
      where: { userId },
      orderBy: { joinedAt: 'asc' },
      select: {
        status: true,
        joinedAt: true,
        endedAt: true,
        program: { select: { name: true } },
      },
    }),
  ]);

  return {
    payments: (payments as RawPayment[]).map(toRow),
    enrollments: enrollments.map((e) => ({
      programName: e.program.name,
      status: e.status,
      joinedAt: e.joinedAt,
      endedAt: e.endedAt,
    })),
    isEmpty: payments.length === 0,
  };
}

export interface AdminPaymentRow extends StudentPaymentRow {
  recordedByName: string | null;
}

/**
 * Every student's payments, grouped by student id — one query for the admin
 * Students screen (avoids an N+1 over the roster).
 */
export async function getAdminPaymentsByStudent(): Promise<Map<string, AdminPaymentRow[]>> {
  const payments = await prisma.payment.findMany({
    where: { user: { role: 'STUDENT' } },
    orderBy: [{ paidAt: 'desc' }, { createdAt: 'desc' }],
    select: { ...PAYMENT_SELECT, userId: true, recordedBy: { select: { name: true } } },
  });

  const byStudent = new Map<string, AdminPaymentRow[]>();
  for (const p of payments as (RawPayment & {
    userId: string;
    recordedBy: { name: string } | null;
  })[]) {
    const row: AdminPaymentRow = { ...toRow(p), recordedByName: p.recordedBy?.name ?? null };
    const list = byStudent.get(p.userId) ?? [];
    list.push(row);
    byStudent.set(p.userId, list);
  }
  return byStudent;
}

export interface PaymentsOverview {
  /** This-month revenue per currency (PAID only), largest first. */
  thisMonthByCurrency: { currency: string; cents: number }[];
  /** 6-month series for the currency with the most PAID volume overall. */
  primaryCurrency: string | null;
  monthlySeries: { month: string; amount: number }[];
  payingStudentCount: number;
  studentCount: number;
  payments: (AdminPaymentRow & { studentName: string; studentEmail: string })[];
}

function monthKey(date: Date) {
  return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
}

/**
 * Aggregate + full list for `/admin/payments`. Revenue counts PAID only and is
 * kept **per currency** — amounts in different currencies are never summed into
 * one number (a per-currency breakdown, not a single converted total, is the
 * honest MVP; see Known Deferred Issues #18).
 */
export async function getPaymentsOverview(): Promise<PaymentsOverview> {
  const [studentCount, payments] = await Promise.all([
    prisma.user.count({ where: { role: 'STUDENT' } }),
    prisma.payment.findMany({
      where: { user: { role: 'STUDENT' } },
      orderBy: [{ paidAt: 'desc' }, { createdAt: 'desc' }],
      select: {
        ...PAYMENT_SELECT,
        recordedBy: { select: { name: true } },
        user: { select: { name: true, email: true } },
      },
    }),
  ]);

  const now = new Date();
  const paid = payments.filter((p) => p.status === 'PAID');

  // this-month totals, grouped by currency
  const thisMonth = new Map<string, number>();
  const totalByCurrency = new Map<string, number>();
  for (const p of paid) {
    totalByCurrency.set(p.currency, (totalByCurrency.get(p.currency) ?? 0) + p.amountCents);
    if (
      p.paidAt &&
      p.paidAt.getMonth() === now.getMonth() &&
      p.paidAt.getFullYear() === now.getFullYear()
    ) {
      thisMonth.set(p.currency, (thisMonth.get(p.currency) ?? 0) + p.amountCents);
    }
  }

  const thisMonthByCurrency = [...thisMonth.entries()]
    .map(([currency, cents]) => ({ currency, cents }))
    .sort((a, b) => b.cents - a.cents);

  const primaryCurrency =
    [...totalByCurrency.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;

  // 6-month series for the primary currency only
  const months: { key: string; amountCents: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    months.push({ key: monthKey(new Date(now.getFullYear(), now.getMonth() - i, 1)), amountCents: 0 });
  }
  for (const p of paid) {
    if (!p.paidAt || p.currency !== primaryCurrency) continue;
    const bucket = months.find((m) => m.key === monthKey(p.paidAt as Date));
    if (bucket) bucket.amountCents += p.amountCents;
  }

  const payingStudentCount = new Set(
    paid.map((p) => (p as { user: { email: string } }).user.email)
  ).size;

  return {
    thisMonthByCurrency,
    primaryCurrency,
    monthlySeries: months.map((m) => ({ month: m.key, amount: m.amountCents / 100 })),
    payingStudentCount,
    studentCount,
    payments: (
      payments as (RawPayment & {
        recordedBy: { name: string } | null;
        user: { name: string; email: string };
      })[]
    ).map((p) => ({
      ...toRow(p),
      recordedByName: p.recordedBy?.name ?? null,
      studentName: p.user.name,
      studentEmail: p.user.email,
    })),
  };
}
