import { redirect } from "next/navigation";
import { Card } from "../../../components/ui/card";
import { DollarSign, UserX, Users } from "lucide-react";
import { getSessionUser } from "../../../lib/authz";
import { prisma } from "../../../lib/prisma";
import { getPaymentsOverview } from "../../../lib/billing/queries";
import { formatMoney } from "../../../lib/billing/format";
import RevenueChart from "./RevenueChart";
import PaymentsAdminClient from "./PaymentsAdminClient";

export const dynamic = "force-dynamic";

function fmtDate(d: Date | null) {
  return d
    ? d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    : "—";
}

export default async function AdminPayments() {
  const user = await getSessionUser();
  if (user?.role !== "ADMIN") {
    redirect("/SignIn");
  }

  const [overview, students] = await Promise.all([
    getPaymentsOverview(),
    prisma.user.findMany({
      where: { role: "STUDENT" },
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        email: true,
        enrollments: {
          orderBy: { joinedAt: "asc" },
          select: { id: true, status: true, program: { select: { name: true } } },
        },
      },
    }),
  ]);

  const studentOptions = students.map((s) => ({
    id: s.id,
    name: s.name,
    email: s.email,
    enrollments: s.enrollments.map((e) => ({
      id: e.id,
      programName: e.program.name,
      status: e.status,
    })),
  }));

  const rows = overview.payments.map((p) => ({
    id: p.id,
    studentName: p.studentName,
    studentEmail: p.studentEmail,
    programName: p.programName,
    amountFormatted: formatMoney(p.amountCents, p.currency),
    status: p.status,
    source: p.source,
    method: p.method,
    reference: p.reference,
    paidAt: fmtDate(p.paidAt),
    recordedByName: p.recordedByName,
  }));

  const studentsWithoutPayment = Math.max(
    0,
    overview.studentCount - overview.payingStudentCount
  );
  const chartCurrency = overview.primaryCurrency ?? "cad";

  return (
    <div className="space-y-4 md:space-y-6 px-2 sm:px-0">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Payments</h1>
        <p className="text-sm text-slate-500 mt-1">
          Real payment records — Stripe-confirmed and admin-recorded — plus monthly revenue
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-6">
        <Card className="p-4 md:p-6 bg-gradient-to-br from-emerald-400 to-emerald-500 text-white border-0">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-emerald-100 text-xs md:text-sm">This Month&apos;s Revenue</p>
              {overview.thisMonthByCurrency.length === 0 ? (
                <p className="text-2xl md:text-3xl font-bold mt-1 md:mt-2">—</p>
              ) : (
                <div className="mt-1 md:mt-2 space-y-0.5">
                  {overview.thisMonthByCurrency.map((c) => (
                    <p key={c.currency} className="text-2xl md:text-3xl font-bold leading-tight">
                      {formatMoney(c.cents, c.currency)}
                    </p>
                  ))}
                </div>
              )}
            </div>
            <div className="w-9 h-9 md:w-12 md:h-12 bg-white/20 rounded-lg flex items-center justify-center">
              <DollarSign className="w-5 h-5 md:w-6 md:h-6" />
            </div>
          </div>
        </Card>

        <Card className="p-4 md:p-6 bg-gradient-to-br from-slate-500 to-slate-600 text-white border-0">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-slate-100 text-xs md:text-sm">Without a Payment on File</p>
              <p className="text-2xl md:text-3xl font-bold mt-1 md:mt-2">{studentsWithoutPayment}</p>
              <p className="text-xs md:text-sm mt-1 md:mt-2">of {overview.studentCount} students</p>
            </div>
            <div className="w-9 h-9 md:w-12 md:h-12 bg-white/20 rounded-lg flex items-center justify-center">
              <UserX className="w-5 h-5 md:w-6 md:h-6" />
            </div>
          </div>
        </Card>

        <Card className="p-4 md:p-6 bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white border-0">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-violet-100 text-xs md:text-sm">Paying Students</p>
              <p className="text-2xl md:text-3xl font-bold mt-1 md:mt-2">
                {overview.payingStudentCount}/{overview.studentCount}
              </p>
            </div>
            <div className="w-9 h-9 md:w-12 md:h-12 bg-white/20 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 md:w-6 md:h-6" />
            </div>
          </div>
        </Card>
      </div>

      <Card className="p-4 md:p-6">
        <h3 className="font-bold text-base md:text-lg text-slate-900 mb-4">
          Revenue by Month{" "}
          <span className="text-sm font-normal text-slate-500">
            ({chartCurrency.toUpperCase()})
          </span>
        </h3>
        <RevenueChart data={overview.monthlySeries} />
      </Card>

      <PaymentsAdminClient rows={rows} students={studentOptions} />
    </div>
  );
}
