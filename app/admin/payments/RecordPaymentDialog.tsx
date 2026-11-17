"use client";

import { useMemo, useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger,
} from "../../../components/ui/dialog";
import { Textarea } from "../../../components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "../../../components/ui/select";
import { Plus } from "lucide-react";
import { recordPaymentAction } from "./actions";

const CURRENCIES = ["CAD", "NGN", "USD", "GBP"] as const;

export interface StudentEnrollmentOption {
  id: string;
  programName: string;
  status: string;
}

export interface StudentOption {
  id: string;
  name: string;
  email: string;
  enrollments: StudentEnrollmentOption[];
}

export default function RecordPaymentDialog({ students }: { students: StudentOption[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [studentId, setStudentId] = useState("");
  const [enrollmentId, setEnrollmentId] = useState("none");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState<(typeof CURRENCIES)[number]>("CAD");
  const [paidAt, setPaidAt] = useState(() => new Date().toISOString().slice(0, 10));
  const [method, setMethod] = useState("");
  const [reference, setReference] = useState("");
  const [note, setNote] = useState("");

  const enrollmentsForStudent = useMemo(
    () => students.find((s) => s.id === studentId)?.enrollments ?? [],
    [students, studentId]
  );

  const reset = () => {
    setStudentId("");
    setEnrollmentId("none");
    setAmount("");
    setCurrency("CAD");
    setPaidAt(new Date().toISOString().slice(0, 10));
    setMethod("");
    setReference("");
    setNote("");
    setError(null);
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    const amountCents = Math.round(Number(amount) * 100);
    if (!studentId) {
      setError("Choose a student.");
      return;
    }
    if (!Number.isFinite(amountCents) || amountCents <= 0) {
      setError("Enter an amount greater than zero.");
      return;
    }

    startTransition(async () => {
      const result = await recordPaymentAction({
        studentId,
        enrollmentId: enrollmentId === "none" ? undefined : enrollmentId,
        amountCents,
        currency,
        paidAt,
        method: method.trim() || undefined,
        reference: reference.trim() || undefined,
        note: note.trim() || undefined,
      });
      if (result.serverError || result.validationErrors) {
        setError(result.serverError ?? "Please check the form and try again.");
        return;
      }
      reset();
      setOpen(false);
      router.refresh();
    });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) reset();
      }}
    >
      <DialogTrigger asChild>
        <Button className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white hover:from-emerald-600 hover:to-emerald-700">
          <Plus className="mr-2 h-4 w-4" />
          Record Payment
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Record a payment</DialogTitle>
          <DialogDescription>
            Enter a payment the institute received (bank transfer, cash, POS, …). It is saved as a
            manual record and does not change the student&apos;s enrollment status.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="rp-student">Student</Label>
            <Select
              value={studentId}
              onValueChange={(v) => {
                setStudentId(v);
                setEnrollmentId("none");
              }}
            >
              <SelectTrigger id="rp-student" className="w-full">
                <SelectValue placeholder="Choose a student" />
              </SelectTrigger>
              <SelectContent>
                {students.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name} ({s.email})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="rp-enrollment">Enrollment (optional)</Label>
            <Select value={enrollmentId} onValueChange={setEnrollmentId} disabled={!studentId}>
              <SelectTrigger id="rp-enrollment" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Not linked to a program</SelectItem>
                {enrollmentsForStudent.map((e) => (
                  <SelectItem key={e.id} value={e.id}>
                    {e.programName} · {e.status.toLowerCase()}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="rp-amount">Amount</Label>
              <Input
                id="rp-amount"
                type="number"
                min="0.01"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="rp-currency">Currency</Label>
              <Select value={currency} onValueChange={(v) => setCurrency(v as typeof currency)}>
                <SelectTrigger id="rp-currency" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CURRENCIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="rp-date">Payment date</Label>
              <Input
                id="rp-date"
                type="date"
                value={paidAt}
                onChange={(e) => setPaidAt(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="rp-method">Method</Label>
              <Input
                id="rp-method"
                placeholder="Bank transfer, Interac…"
                value={method}
                onChange={(e) => setMethod(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="rp-reference">Reference (optional)</Label>
            <Input
              id="rp-reference"
              placeholder="Receipt / transaction id"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="rp-note">Note (optional)</Label>
            <Textarea
              id="rp-note"
              rows={2}
              placeholder="Anything worth recording about this payment"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>

          {error && (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          )}

          <DialogFooter>
            <Button
              type="submit"
              className="bg-emerald-600 hover:bg-emerald-700"
              disabled={isPending}
            >
              {isPending ? "Recording…" : "Record payment"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
