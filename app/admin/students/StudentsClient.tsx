"use client";

import { useEffect, useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Card } from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { Badge } from "../../../components/ui/badge";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from "../../../components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger,
} from "../../../components/ui/dialog";
import {
  AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogFooter,
  AlertDialogTitle, AlertDialogDescription, AlertDialogAction, AlertDialogCancel,
} from "../../../components/ui/alert-dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "../../../components/ui/select";
import { UserPlus, Settings2, Archive, ArchiveRestore, Send, Trash2 } from "lucide-react";
import { ENROLLMENT_TRANSITIONS } from "../../../lib/enrollment/status";
import { AccountStatusBadge, type AccountStatus } from "../../../components/AccountStatusBadge";
import { InviteLinkPanel } from "../../../components/InviteLinkPanel";
import {
  addStudentAction, setStudentDeactivatedAction, resendStudentInviteAction,
  revokeStudentInviteAction, enrollStudentAction, updateEnrollmentStatusAction,
} from "./actions";

type EnrollmentStatus = "PENDING" | "ACTIVE" | "PAUSED" | "COMPLETED" | "CANCELLED";

interface EnrollmentRow {
  id: string;
  programId: string;
  programName: string;
  status: EnrollmentStatus;
}

interface PaymentRow {
  id: string;
  amountFormatted: string;
  status: string;
  source: string;
  method: string | null;
  programName: string | null;
  paidAt: string;
}

interface StudentRow {
  id: string;
  name: string;
  email: string;
  status: AccountStatus;
  joinedDate: string;
  enrollments: EnrollmentRow[];
  payments: PaymentRow[];
}

interface ProgramOption {
  id: string;
  name: string;
}

const STATUS_LABEL: Record<EnrollmentStatus, string> = {
  PENDING: "pending",
  ACTIVE: "active",
  PAUSED: "paused",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
};

const STATUS_BADGE_CLASS: Record<EnrollmentStatus, string> = {
  PENDING: "bg-slate-100 text-slate-600 hover:bg-slate-100",
  ACTIVE: "bg-emerald-50 text-emerald-700 hover:bg-emerald-50",
  PAUSED: "bg-amber-50 text-amber-700 hover:bg-amber-50",
  COMPLETED: "bg-sky-50 text-sky-700 hover:bg-sky-50",
  CANCELLED: "bg-red-50 text-red-600 hover:bg-red-50",
};

export default function StudentsClient({
  initialStudents,
  programs,
  includeDeactivated,
}: {
  initialStudents: StudentRow[];
  programs: ProgramOption[];
  includeDeactivated: boolean;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [students, setStudents] = useState(initialStudents);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [manageTarget, setManageTarget] = useState<StudentRow | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [manageError, setManageError] = useState<string | null>(null);
  // Invite links returned when an email could not be sent — keyed by student id.
  const [inviteLinks, setInviteLinks] = useState<Record<string, string>>({});

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [programId, setProgramId] = useState(programs[0]?.id ?? "");
  const [newEnrollProgramId, setNewEnrollProgramId] = useState("");

  useEffect(() => {
    setStudents(initialStudents);
  }, [initialStudents]);

  useEffect(() => {
    if (manageTarget) {
      const updated = students.find((s) => s.id === manageTarget.id);
      if (updated) setManageTarget(updated);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [students]);

  const handleAddStudent = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await addStudentAction({ name, email, programId });
      if (result.serverError || result.validationErrors) {
        setError(result.serverError ?? "Please check the form and try again.");
        return;
      }
      const data = result.data;
      if (data && !data.inviteEmailSent && data.inviteUrl) {
        setInviteLinks((prev) => ({ ...prev, [data.studentId]: data.inviteUrl! }));
      }
      setName("");
      setEmail("");
      setProgramId(programs[0]?.id ?? "");
      setIsAddOpen(false);
      router.refresh();
    });
  };

  const handleSetDeactivated = (student: StudentRow, deactivated: boolean) => {
    setError(null);
    startTransition(async () => {
      const result = await setStudentDeactivatedAction({ studentId: student.id, deactivated });
      if (result.serverError) {
        setError(result.serverError);
        return;
      }
      router.refresh();
    });
  };

  const handleResendInvite = (student: StudentRow) => {
    setError(null);
    startTransition(async () => {
      const result = await resendStudentInviteAction({ studentId: student.id });
      if (result.serverError) {
        setError(result.serverError);
        return;
      }
      const data = result.data;
      if (data && !data.inviteEmailSent && data.inviteUrl) {
        setInviteLinks((prev) => ({ ...prev, [student.id]: data.inviteUrl! }));
      } else {
        setInviteLinks((prev) => {
          const next = { ...prev };
          delete next[student.id];
          return next;
        });
      }
      router.refresh();
    });
  };

  const handleRevokeInvite = (student: StudentRow) => {
    setError(null);
    startTransition(async () => {
      const result = await revokeStudentInviteAction({ studentId: student.id });
      if (result.serverError) {
        setError(result.serverError);
        return;
      }
      setInviteLinks((prev) => {
        const next = { ...prev };
        delete next[student.id];
        return next;
      });
      router.refresh();
    });
  };

  const availableProgramsFor = (student: StudentRow) => {
    const enrolledIds = new Set(student.enrollments.map((e) => e.programId));
    return programs.filter((p) => !enrolledIds.has(p.id));
  };

  const handleEnroll = () => {
    if (!manageTarget || !newEnrollProgramId) return;
    setManageError(null);
    startTransition(async () => {
      const result = await enrollStudentAction({
        studentId: manageTarget.id,
        programId: newEnrollProgramId,
      });
      if (result.serverError) {
        setManageError(result.serverError);
        return;
      }
      setNewEnrollProgramId("");
      router.refresh();
    });
  };

  const handleStatusChange = (enrollmentId: string, status: EnrollmentStatus) => {
    setManageError(null);
    startTransition(async () => {
      const result = await updateEnrollmentStatusAction({ enrollmentId, status });
      if (result.serverError) {
        setManageError(result.serverError);
      }
      router.refresh();
    });
  };

  return (
    <div className="space-y-4 md:space-y-6 px-2 sm:px-0">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Students</h1>
          <p className="text-sm text-slate-500 mt-1">Manage roster and program enrollment</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              router.push(includeDeactivated ? "/admin/students" : "/admin/students?deactivated=1")
            }
          >
            {includeDeactivated ? "Hide deactivated" : "Show deactivated"}
          </Button>
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white hover:from-violet-600 hover:to-fuchsia-600">
                <UserPlus className="w-4 h-4 mr-2" />
                Add Student
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Student</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleAddStudent} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="studentName">Name</Label>
                  <Input
                    id="studentName"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="studentEmail">Email</Label>
                  <Input
                    id="studentEmail"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="studentProgram">Program</Label>
                  <Select value={programId} onValueChange={setProgramId}>
                    <SelectTrigger id="studentProgram" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {programs.map((program) => (
                        <SelectItem key={program.id} value={program.id}>
                          {program.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <p className="text-xs text-slate-500">
                  The student gets an email invite to set their password. Their enrollment starts
                  pending until you activate it.
                </p>
                {error && (
                  <p className="text-sm text-destructive" role="alert">
                    {error}
                  </p>
                )}
                <DialogFooter>
                  <Button type="submit" className="bg-violet-600 hover:bg-violet-700" disabled={isPending}>
                    {isPending ? "Adding..." : "Add Student"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <InviteLinkPanel
        links={Object.fromEntries(
          Object.entries(inviteLinks).map(([id, url]) => [
            students.find((s) => s.id === id)?.email ?? id,
            url,
          ])
        )}
      />

      {error && !isAddOpen && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Account</TableHead>
                <TableHead>Programs</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {students.map((student) => (
                <TableRow key={student.id} className={student.status === "DEACTIVATED" ? "opacity-60" : undefined}>
                  <TableCell className="font-medium text-slate-900">{student.name}</TableCell>
                  <TableCell className="text-slate-500">{student.email}</TableCell>
                  <TableCell>
                    <AccountStatusBadge status={student.status} />
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1.5">
                      {student.enrollments.length === 0 && (
                        <span className="text-xs text-slate-400">No programs</span>
                      )}
                      {student.enrollments.map((e) => (
                        <Badge
                          key={e.id}
                          variant="secondary"
                          className={STATUS_BADGE_CLASS[e.status]}
                        >
                          {e.programName} · {STATUS_LABEL[e.status]}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="text-slate-500">{student.joinedDate}</TableCell>
                  <TableCell className="text-right space-x-2 whitespace-nowrap">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setManageError(null);
                        setNewEnrollProgramId("");
                        setManageTarget(student);
                      }}
                    >
                      <Settings2 className="w-4 h-4 mr-1" />
                      Manage
                    </Button>
                    {student.status === "INVITED" && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleResendInvite(student)}
                          disabled={isPending}
                        >
                          <Send className="w-4 h-4 mr-1" />
                          Resend invite
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              className="border-red-300 text-red-600 hover:bg-red-50"
                            >
                              <Trash2 className="w-4 h-4 mr-1" />
                              Revoke invite
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Revoke the invite for {student.name}?</AlertDialogTitle>
                              <AlertDialogDescription>
                                The unactivated account for {student.email} and its activation link
                                will be removed. Nothing of theirs exists yet — they never signed in.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleRevokeInvite(student)}>
                                Revoke invite
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </>
                    )}
                    {student.status === "ACTIVE" && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-red-300 text-red-600 hover:bg-red-50"
                          >
                            <Archive className="w-4 h-4 mr-1" />
                            Deactivate
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Deactivate {student.name}?</AlertDialogTitle>
                            <AlertDialogDescription>
                              {student.name} will no longer be able to sign in. All of their
                              enrollments, submissions, grades, attendance and payment history are
                              kept, and you can reactivate the account at any time.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleSetDeactivated(student, true)}>
                              Deactivate
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                    {student.status === "DEACTIVATED" && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                        onClick={() => handleSetDeactivated(student, false)}
                        disabled={isPending}
                      >
                        <ArchiveRestore className="w-4 h-4 mr-1" />
                        Reactivate
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {students.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-slate-500 py-8">
                    No students yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      <Dialog open={!!manageTarget} onOpenChange={(open) => !open && setManageTarget(null)}>
        <DialogContent className="max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Manage Enrollments — {manageTarget?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {manageTarget && manageTarget.enrollments.length === 0 && (
              <p className="text-sm text-slate-500">Not enrolled in any program yet.</p>
            )}
            {manageTarget?.enrollments.map((e) => {
              const options = [e.status, ...ENROLLMENT_TRANSITIONS[e.status]] as EnrollmentStatus[];
              return (
                <div key={e.id} className="flex items-center justify-between gap-3">
                  <span className="text-sm font-medium text-slate-900">{e.programName}</span>
                  <Select
                    value={e.status}
                    onValueChange={(value) => handleStatusChange(e.id, value as EnrollmentStatus)}
                  >
                    <SelectTrigger className="h-8 w-[150px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {options.map((status) => (
                        <SelectItem key={status} value={status}>
                          {STATUS_LABEL[status]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              );
            })}

            {manageTarget && manageTarget.payments.length > 0 && (
              <div className="pt-3 border-t border-slate-200">
                <p className="text-xs font-medium text-slate-500 mb-2">Payments</p>
                <ul className="space-y-1.5">
                  {manageTarget.payments.map((p) => (
                    <li key={p.id} className="flex items-center justify-between gap-3 text-sm">
                      <span className="text-slate-600">
                        {p.paidAt}
                        {p.programName ? ` · ${p.programName}` : ""}
                        <span className="text-slate-400">
                          {" "}
                          · {p.source === "STRIPE" ? "Card" : p.method ?? "Manual"}
                        </span>
                      </span>
                      <span className="flex items-center gap-2">
                        <span className="font-medium text-slate-900">{p.amountFormatted}</span>
                        <Badge
                          variant="secondary"
                          className={
                            p.status === "PAID"
                              ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-50"
                              : "bg-slate-100 text-slate-600 hover:bg-slate-100"
                          }
                        >
                          {p.status.toLowerCase()}
                        </Badge>
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {manageTarget && availableProgramsFor(manageTarget).length > 0 && (
              <div className="pt-3 border-t border-slate-200 space-y-2">
                <Label htmlFor="enrollProgram">Enroll in another program</Label>
                <div className="flex gap-2">
                  <Select value={newEnrollProgramId} onValueChange={setNewEnrollProgramId}>
                    <SelectTrigger id="enrollProgram" className="flex-1">
                      <SelectValue placeholder="Choose a program" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableProgramsFor(manageTarget).map((program) => (
                        <SelectItem key={program.id} value={program.id}>
                          {program.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    type="button"
                    onClick={handleEnroll}
                    disabled={!newEnrollProgramId || isPending}
                  >
                    Enroll
                  </Button>
                </div>
              </div>
            )}

            {manageError && (
              <p className="text-sm text-destructive" role="alert">
                {manageError}
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setManageTarget(null)}>
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}
