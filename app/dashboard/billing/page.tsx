import { redirect } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from "@/components/ui/table";
import { CreditCard, Landmark, Receipt } from "lucide-react";
import { getSessionUser } from "@/lib/authz";
import { getStudentBilling } from "@/lib/billing/queries";
import { formatMoney } from "@/lib/billing/format";

export const dynamic = "force-dynamic";

const STATUS_BADGE: Record<string, string> = {
  PAID: "bg-emerald-100 text-emerald-700 hover:bg-emerald-100",
  REFUNDED: "bg-slate-100 text-slate-700 hover:bg-slate-100",
  UNPAID: "bg-amber-100 text-amber-700 hover:bg-amber-100",
  OVERDUE: "bg-red-100 text-red-700 hover:bg-red-100",
};

const ENROLLMENT_BADGE: Record<string, string> = {
  PENDING: "bg-slate-100 text-slate-600 hover:bg-slate-100",
  ACTIVE: "bg-emerald-50 text-emerald-700 hover:bg-emerald-50",
  PAUSED: "bg-amber-50 text-amber-700 hover:bg-amber-50",
  COMPLETED: "bg-sky-50 text-sky-700 hover:bg-sky-50",
  CANCELLED: "bg-red-50 text-red-600 hover:bg-red-50",
};

function fmtDate(d: Date | null) {
  return d
    ? d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    : "—";
}

export default async function Billing() {
  const user = await getSessionUser();
  if (!user?.id) {
    redirect("/SignIn");
  }

  const { payments, enrollments, isEmpty } = await getStudentBilling(user.id);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Billing</h1>
        <p className="mt-2 text-slate-600">Your payment history and enrollments</p>
      </div>

      {/* Enrollments */}
      {enrollments.length > 0 && (
        <div>
          <h2 className="mb-4 text-xl font-bold text-slate-900">Enrollments</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {enrollments.map((e) => (
              <Card key={e.programName} className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="font-bold text-slate-900">{e.programName}</h3>
                    <p className="mt-1 text-xs text-slate-500">
                      Joined {fmtDate(e.joinedAt)}
                      {e.endedAt ? ` · ended ${fmtDate(e.endedAt)}` : ""}
                    </p>
                  </div>
                  <Badge variant="secondary" className={ENROLLMENT_BADGE[e.status]}>
                    {e.status.toLowerCase()}
                  </Badge>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Payment history */}
      <div>
        <h2 className="mb-4 text-xl font-bold text-slate-900">Payment history</h2>

        {isEmpty ? (
          <Card className="p-8 md:p-12 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-sky-100">
              <Receipt className="h-7 w-7 text-sky-600" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">No payments recorded yet</h3>
            <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
              When you make a payment, or the institute records one for you, it will appear here with
              its amount, date and reference.
            </p>
          </Card>
        ) : (
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Program</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Reference</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="text-sm text-slate-700">{fmtDate(p.paidAt)}</TableCell>
                      <TableCell className="text-sm text-slate-900">
                        {p.programName ?? "—"}
                      </TableCell>
                      <TableCell className="text-sm font-medium text-slate-900">
                        {formatMoney(p.amountCents, p.currency)}
                      </TableCell>
                      <TableCell className="text-sm text-slate-600">
                        <span className="inline-flex items-center gap-1.5">
                          {p.source === "STRIPE" ? (
                            <>
                              <CreditCard className="h-3.5 w-3.5 text-slate-400" />
                              Card
                            </>
                          ) : (
                            <>
                              <Landmark className="h-3.5 w-3.5 text-slate-400" />
                              {p.method ?? "Manual"}
                            </>
                          )}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge className={STATUS_BADGE[p.status] ?? STATUS_BADGE.UNPAID}>
                          {p.status.toLowerCase()}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-slate-500">
                        {p.reference ?? "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
