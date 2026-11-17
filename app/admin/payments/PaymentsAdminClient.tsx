"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Card } from "../../../components/ui/card";
import { Badge } from "../../../components/ui/badge";
import { Button } from "../../../components/ui/button";
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from "../../../components/ui/table";
import {
  AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogFooter,
  AlertDialogTitle, AlertDialogDescription, AlertDialogAction, AlertDialogCancel,
} from "../../../components/ui/alert-dialog";
import { CreditCard, Landmark } from "lucide-react";
import RecordPaymentDialog, { type StudentOption } from "./RecordPaymentDialog";
import { updatePaymentStatusAction } from "./actions";

export interface AdminPaymentListRow {
  id: string;
  studentName: string;
  studentEmail: string;
  programName: string | null;
  amountFormatted: string;
  status: string;
  source: "STRIPE" | "MANUAL";
  method: string | null;
  reference: string | null;
  paidAt: string;
  recordedByName: string | null;
}

const STATUS_BADGE: Record<string, string> = {
  PAID: "bg-emerald-100 text-emerald-700 hover:bg-emerald-100",
  REFUNDED: "bg-slate-100 text-slate-700 hover:bg-slate-100",
  UNPAID: "bg-amber-100 text-amber-700 hover:bg-amber-100",
  OVERDUE: "bg-red-100 text-red-700 hover:bg-red-100",
};

export default function PaymentsAdminClient({
  rows,
  students,
}: {
  rows: AdminPaymentListRow[];
  students: StudentOption[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const refund = (paymentId: string) => {
    setError(null);
    startTransition(async () => {
      const result = await updatePaymentStatusAction({ paymentId, status: "REFUNDED" });
      if (result.serverError) {
        setError(result.serverError);
        return;
      }
      router.refresh();
    });
  };

  const RefundButton = ({ row }: { row: AdminPaymentListRow }) => (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="outline" size="sm" className="border-slate-300" disabled={isPending}>
          Mark refunded
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Mark this payment as refunded?</AlertDialogTitle>
          <AlertDialogDescription>
            {row.amountFormatted} from {row.studentName} ({row.paidAt}) will be recorded as
            refunded. The payment record is kept — this only changes its status.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={() => refund(row.id)}>Mark refunded</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );

  return (
    <Card className="overflow-hidden">
      <div className="flex flex-col gap-3 border-b border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between md:p-6">
        <div>
          <h3 className="font-bold text-base md:text-lg text-slate-900">All payments</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Card = confirmed by Stripe · Manual = recorded by an admin
          </p>
        </div>
        <RecordPaymentDialog students={students} />
      </div>

      {error && (
        <p className="px-4 pt-3 text-sm text-destructive md:px-6" role="alert">
          {error}
        </p>
      )}

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Student</TableHead>
              <TableHead>Program</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Method</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="py-8 text-center text-slate-500">
                  No payments recorded yet.
                </TableCell>
              </TableRow>
            )}
            {rows.map((p) => (
              <TableRow key={p.id}>
                <TableCell className="text-sm text-slate-600">{p.paidAt}</TableCell>
                <TableCell className="text-sm">
                  <span className="font-medium text-slate-900">{p.studentName}</span>
                  <span className="block text-xs text-slate-400">{p.studentEmail}</span>
                </TableCell>
                <TableCell className="text-sm text-slate-600">{p.programName ?? "—"}</TableCell>
                <TableCell className="text-sm font-medium text-slate-900">
                  {p.amountFormatted}
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
                <TableCell className="text-right">
                  {p.status === "PAID" && <RefundButton row={p} />}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
}
