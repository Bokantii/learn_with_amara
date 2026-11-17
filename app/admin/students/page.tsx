import { prisma } from '../../../lib/prisma';
import { formatMoney } from '../../../lib/billing/format';
import { getAdminPaymentsByStudent, type AdminPaymentRow } from '../../../lib/billing/queries';
import { listAdminStudents } from '../../../lib/account/queries';
import StudentsClient from './StudentsClient';

export const dynamic = 'force-dynamic';

export default async function AdminStudentsPage({
  searchParams,
}: {
  searchParams: Promise<{ deactivated?: string }>;
}) {
  const includeDeactivated = (await searchParams).deactivated === '1';

  const [students, programs, paymentsByStudent] = await Promise.all([
    listAdminStudents({ includeDeactivated }),
    prisma.program.findMany({ where: { active: true }, orderBy: { name: 'asc' } }),
    getAdminPaymentsByStudent(),
  ]);

  const rows = students.map((student) => ({
    id: student.id,
    name: student.name,
    email: student.email,
    status: student.status,
    joinedDate: student.createdAt.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }),
    enrollments: student.enrollments.map((e) => ({
      id: e.id,
      programId: e.programId,
      programName: e.program.name,
      status: e.status,
    })),
    payments: (paymentsByStudent.get(student.id) ?? []).map(toPaymentRow),
  }));

  const programOptions = programs.map((program) => ({ id: program.id, name: program.name }));

  return (
    <StudentsClient
      initialStudents={rows}
      programs={programOptions}
      includeDeactivated={includeDeactivated}
    />
  );
}

function toPaymentRow(p: AdminPaymentRow) {
  return {
    id: p.id,
    amountFormatted: formatMoney(p.amountCents, p.currency),
    status: p.status,
    source: p.source,
    method: p.method,
    programName: p.programName,
    paidAt: p.paidAt
      ? p.paidAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      : '—',
  };
}
