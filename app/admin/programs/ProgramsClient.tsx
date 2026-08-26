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
import { BookOpen, Pencil, Archive, ArchiveRestore } from "lucide-react";
import { createProgramAction, updateProgramAction, setProgramActiveAction } from "./actions";

interface ProgramRow {
  id: string;
  name: string;
  track: string;
  active: boolean;
  enrollmentCount: number;
}

export default function ProgramsClient({
  initialPrograms,
}: {
  initialPrograms: ProgramRow[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [programs, setPrograms] = useState(initialPrograms);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<ProgramRow | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [track, setTrack] = useState("");

  useEffect(() => {
    setPrograms(initialPrograms);
  }, [initialPrograms]);

  useEffect(() => {
    if (editTarget) {
      setName(editTarget.name);
      setTrack(editTarget.track);
    }
  }, [editTarget]);

  const handleCreate = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await createProgramAction({ name, track });
      if (result.serverError || result.validationErrors) {
        setError(result.serverError ?? "Please check the form and try again.");
        return;
      }
      setName("");
      setTrack("");
      setIsCreateOpen(false);
      router.refresh();
    });
  };

  const handleUpdate = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editTarget) return;
    setError(null);
    startTransition(async () => {
      const result = await updateProgramAction({ programId: editTarget.id, name, track });
      if (result.serverError || result.validationErrors) {
        setError(result.serverError ?? "Please check the form and try again.");
        return;
      }
      setEditTarget(null);
      router.refresh();
    });
  };

  const handleToggleActive = (program: ProgramRow) => {
    setPrograms((prev) =>
      prev.map((p) => (p.id === program.id ? { ...p, active: !p.active } : p))
    );
    startTransition(async () => {
      const result = await setProgramActiveAction({ programId: program.id, active: !program.active });
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
          <h1 className="text-2xl font-bold text-slate-900">Programs</h1>
          <p className="text-sm text-slate-500 mt-1">Manage programs students can enroll in</p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white hover:from-violet-600 hover:to-fuchsia-600">
              <BookOpen className="w-4 h-4 mr-2" />
              Add Program
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Program</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="programName">Name</Label>
                <Input
                  id="programName"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="TCF Exam Preparation"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="programTrack">Track</Label>
                <Input
                  id="programTrack"
                  value={track}
                  onChange={(e) => setTrack(e.target.value)}
                  placeholder="tcf-exam-prep"
                  required
                />
              </div>
              {error && (
                <p className="text-sm text-destructive" role="alert">
                  {error}
                </p>
              )}
              <DialogFooter>
                <Button type="submit" className="bg-violet-600 hover:bg-violet-700" disabled={isPending}>
                  {isPending ? "Adding..." : "Add Program"}
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
                <TableHead>Track</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Enrollments</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {programs.map((program) => (
                <TableRow key={program.id}>
                  <TableCell className="font-medium text-slate-900">{program.name}</TableCell>
                  <TableCell className="text-slate-500">{program.track}</TableCell>
                  <TableCell>
                    <Badge
                      variant="secondary"
                      className={
                        program.active
                          ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-50"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-100"
                      }
                    >
                      {program.active ? "active" : "archived"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-slate-500">{program.enrollmentCount}</TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button variant="outline" size="sm" onClick={() => setEditTarget(program)}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className={program.active ? "border-amber-300 text-amber-600 hover:bg-amber-50" : "border-emerald-300 text-emerald-600 hover:bg-emerald-50"}
                      onClick={() => handleToggleActive(program)}
                      disabled={isPending}
                    >
                      {program.active ? <Archive className="w-4 h-4" /> : <ArchiveRestore className="w-4 h-4" />}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {programs.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-slate-500 py-8">
                    No programs yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      <Dialog open={!!editTarget} onOpenChange={(open) => !open && setEditTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Program</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdate} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="editProgramName">Name</Label>
              <Input
                id="editProgramName"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editProgramTrack">Track</Label>
              <Input
                id="editProgramTrack"
                value={track}
                onChange={(e) => setTrack(e.target.value)}
                required
              />
            </div>
            {error && (
              <p className="text-sm text-destructive" role="alert">
                {error}
              </p>
            )}
            <DialogFooter>
              <Button variant="outline" type="button" onClick={() => setEditTarget(null)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-violet-600 hover:bg-violet-700" disabled={isPending}>
                {isPending ? "Saving..." : "Save"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
