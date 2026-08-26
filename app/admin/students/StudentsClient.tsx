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
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "../../../components/ui/select";
import { UserPlus, Trash2, Settings2 } from "lucide-react";
import {
  addStudentAction, removeStudentAction, enrollStudentAction, updateEnrollmentStatusAction,
} from "./actions";

type EnrollmentStatus = "PENDING" | "ACTIVE" | "PAUSED" | "COMPLETED" | "CANCELLED";

interface EnrollmentRow {
  id: string;
  programId: string;
  programName: string;
  status: EnrollmentStatus;
}

interface StudentRow {
  id: string;
  name: string;
  email: string;
  joinedDate: string;
  enrollments: EnrollmentRow[];
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
}: {
  initialStudents: StudentRow[];
  programs: ProgramOption[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [students, setStudents] = useState(initialStudents);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [manageTarget, setManageTarget] = useState<StudentRow | null>(null);
  const [removeTarget, setRemoveTarget] = useState<StudentRow | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [manageError, setManageError] = useState<string | null>(null);

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
      setName("");
      setEmail("");
      setProgramId(programs[0]?.id ?? "");
      setIsAddOpen(false);
      router.refresh();
    });
  };

  const handleRemove = () => {
    if (!removeTarget) return;
    setError(null);
    startTransition(async () => {
      const result = await removeStudentAction({ studentId: removeTarget.id });
      if (result.serverError) {
        setError(result.serverError);
        return;
      }
      setRemoveTarget(null);
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

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Programs</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {students.map((student) => (
                <TableRow key={student.id}>
                  <TableCell className="font-medium text-slate-900">{student.name}</TableCell>
                  <TableCell className="text-slate-500">{student.email}</TableCell>
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
                  <TableCell className="text-right space-x-2">
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
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-red-300 text-red-600 hover:bg-red-50"
                      onClick={() => setRemoveTarget(student)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {students.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-slate-500 py-8">
                    No students yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      <Dialog open={!!manageTarget} onOpenChange={(open) => !open && setManageTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Manage Enrollments — {manageTarget?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {manageTarget && manageTarget.enrollments.length === 0 && (
              <p className="text-sm text-slate-500">Not enrolled in any program yet.</p>
            )}
            {manageTarget?.enrollments.map((e) => (
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
                    {(Object.keys(STATUS_LABEL) as EnrollmentStatus[]).map((status) => (
                      <SelectItem key={status} value={status}>
                        {STATUS_LABEL[status]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ))}

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

      <Dialog open={!!removeTarget} onOpenChange={(open) => !open && setRemoveTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove {removeTarget?.name}?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-slate-500">
            This will remove {removeTarget?.name}, including their enrollments, assignment and
            payment history. This can&apos;t be undone.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRemoveTarget(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleRemove} disabled={isPending}>
              {isPending ? "Removing..." : "Remove Student"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
