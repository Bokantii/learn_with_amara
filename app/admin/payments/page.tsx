import { Card } from "../../../components/ui/card";
import { Badge } from "../../../components/ui/badge";
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from "../../../components/ui/table";
import { DollarSign, UserX, Users } from "lucide-react";
import { prisma } from "../../../lib/prisma";
import RevenueChart from "./RevenueChart";

function formatDollars(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

function monthKey(date: Date) {
  return date.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
}

export default async function AdminPayments() {
  const [students, payments] = await Promise.all([
    prisma.user.findMany({
      where: { role: "STUDENT" },
      include: {
        enrollments: { include: { program: true }, take: 1 },
        payments: { where: { status: "PAID" }, orderBy: { paidAt: "desc" } },
      },
      orderBy: { createdAt: "asc" },
    }),
    prisma.payment.findMany({ where: { status: "PAID" } }),
  ]);

  const now = new Date();
  const thisMonthRevenueCents = payments
    .filter((p) => p.paidAt && p.paidAt.getMonth() === now.getMonth() && p.paidAt.getFullYear() === now.getFullYear())
    .reduce((sum, p) => sum + p.amountCents, 0);

  const payingStudents = students.filter((s) => s.payments.length > 0);
  const studentsWithoutPayment = students.length - payingStudents.length;

  // Build the last 6 months (oldest to newest), summing real payments per month.
  const months: { key: string; amountCents: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({ key: monthKey(d), amountCents: 0 });
  }
  for (const payment of payments) {
    if (!payment.paidAt) continue;
    const key = monthKey(payment.paidAt);
    const bucket = months.find((m) => m.key === key);
    if (bucket) bucket.amountCents += payment.amountCents;
  }
  const chartData = months.map((m) => ({ month: m.key, amount: m.amountCents / 100 }));

  return (
    <div className="space-y-4 md:space-y-6 px-2 sm:px-0">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Payments</h1>
        <p className="text-sm text-slate-500 mt-1">See who's paying, who isn't, and monthly revenue</p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-6">
        <Card className="p-4 md:p-6 bg-gradient-to-br from-emerald-400 to-emerald-500 text-white border-0">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-emerald-100 text-xs md:text-sm">This Month's Revenue</p>
              <p className="text-2xl md:text-3xl font-bold mt-1 md:mt-2">{formatDollars(thisMonthRevenueCents)}</p>
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
              <p className="text-xs md:text-sm mt-1 md:mt-2">of {students.length} students</p>
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
                {payingStudents.length}/{students.length}
              </p>
            </div>
            <div className="w-9 h-9 md:w-12 md:h-12 bg-white/20 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 md:w-6 md:h-6" />
            </div>
          </div>
        </Card>
      </div>

      {/* Revenue Trend */}
      <Card className="p-4 md:p-6">
        <h3 className="font-bold text-base md:text-lg text-slate-900 mb-4">Revenue by Month</h3>
        <RevenueChart data={chartData} />
      </Card>

      {/* Per-Student Payment Status */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Program</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Total Paid</TableHead>
                <TableHead>Last Payment</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {students.map((student) => {
                const hasPaid = student.payments.length > 0;
                const totalPaidCents = student.payments.reduce((sum, p) => sum + p.amountCents, 0);
                const lastPayment = student.payments[0];
                return (
                  <TableRow key={student.id}>
                    <TableCell className="font-medium text-slate-900">{student.name}</TableCell>
                    <TableCell className="text-slate-500">
                      {student.enrollments[0]?.program.name ?? "—"}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={
                          hasPaid
                            ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-50"
                            : "bg-slate-100 text-slate-700 hover:bg-slate-100"
                        }
                      >
                        {hasPaid ? "paid" : "no payment yet"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-slate-900">
                      {hasPaid ? formatDollars(totalPaidCents) : "—"}
                    </TableCell>
                    <TableCell className="text-slate-500">
                      {lastPayment?.paidAt
                        ? lastPayment.paidAt.toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })
                        : "—"}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}
