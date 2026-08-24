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
import { UserPlus, Trash2 } from "lucide-react";
import { addStudentAction, removeStudentAction, reassignProgramAction } from "./actions";

interface StudentRow {
  id: string;
  name: string;
  email: string;
  programId: string;
  status: "ACTIVE" | "PAUSED";
  joinedDate: string;
}

interface ProgramOption {
  id: string;
  name: string;
}

function programName(programs: ProgramOption[], id: string) {
  return programs.find((p) => p.id === id)?.name ?? "—";
}

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
  const [removeTarget, setRemoveTarget] = useState<StudentRow | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [programId, setProgramId] = useState(programs[0]?.id ?? "");

  useEffect(() => {
    setStudents(initialStudents);
  }, [initialStudents]);

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

  const handleReassign = (studentId: string, newProgramId: string) => {
    setStudents((prev) =>
      prev.map((s) => (s.id === studentId ? { ...s, programId: newProgramId } : s))
    );
    startTransition(async () => {
      const result = await reassignProgramAction({ studentId, programId: newProgramId });
      if (result.serverError) {
        setError(result.serverError);
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
                <TableHead>Program</TableHead>
                <TableHead>Status</TableHead>
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
                    <Select
                      value={student.programId}
                      onValueChange={(value) => handleReassign(student.id, value)}
                    >
                      <SelectTrigger className="h-8 w-[190px]">
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
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="secondary"
                      className={
                        student.status === "ACTIVE"
                          ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-50"
                          : "bg-amber-50 text-amber-700 hover:bg-amber-50"
                      }
                    >
                      {student.status === "ACTIVE" ? "active" : "paused"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-slate-500">{student.joinedDate}</TableCell>
                  <TableCell className="text-right">
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
                  <TableCell colSpan={6} className="text-center text-slate-500 py-8">
                    No students yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      <Dialog open={!!removeTarget} onOpenChange={(open) => !open && setRemoveTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove {removeTarget?.name}?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-slate-500">
            This will remove {removeTarget?.name} from{" "}
            {removeTarget ? programName(programs, removeTarget.programId) : ""}, including their
            assignment and payment history. This can&apos;t be undone.
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
