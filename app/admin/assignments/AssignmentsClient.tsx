"use client";

import { useEffect, useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader } from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { Badge } from "../../../components/ui/badge";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger,
} from "../../../components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "../../../components/ui/select";
import { Plus, ClipboardList, Calendar, Award } from "lucide-react";
import { createAssignmentAction } from "./actions";

type AssignmentType = "Exercise" | "Mock Test" | "Practice" | "Quiz";
type AssignmentPriority = "high" | "medium" | "low";

interface AssignmentRow {
  id: string;
  title: string;
  programId: string;
  programName: string;
  groupId: string | null;
  groupName: string | null;
  dueDate: string;
  points: number;
  type: string;
  priority: AssignmentPriority;
  submissionCount: number;
}

interface ProgramOption {
  id: string;
  name: string;
}

interface GroupOption {
  id: string;
  name: string;
  programId: string;
}

const priorityStyles: Record<AssignmentPriority, string> = {
  high: "bg-red-50 text-red-700",
  medium: "bg-amber-50 text-amber-700",
  low: "bg-slate-100 text-slate-700",
};

const assignmentTypes: AssignmentType[] = ["Exercise", "Mock Test", "Practice", "Quiz"];

const NO_GROUP = "__none__";

export default function AssignmentsClient({
  initialAssignments,
  programs,
  groups,
}: {
  initialAssignments: AssignmentRow[];
  programs: ProgramOption[];
  groups: GroupOption[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [assignments, setAssignments] = useState(initialAssignments);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [programId, setProgramId] = useState(programs[0]?.id ?? "");
  const [groupId, setGroupId] = useState(NO_GROUP);
  const [dueDate, setDueDate] = useState("");
  const [points, setPoints] = useState(20);
  const [type, setType] = useState<AssignmentType>("Exercise");
  const [priority, setPriority] = useState<AssignmentPriority>("medium");

  useEffect(() => {
    setAssignments(initialAssignments);
  }, [initialAssignments]);

  const groupsForProgram = groups.filter((g) => g.programId === programId);

  const handleCreate = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await createAssignmentAction({
        title,
        programId,
        groupId: groupId === NO_GROUP ? undefined : groupId,
        dueDate,
        points,
        type,
        priority,
      });
      if (result.serverError || result.validationErrors) {
        setError(result.serverError ?? "Please check the form and try again.");
        return;
      }
      setTitle("");
      setDueDate("");
      setPoints(20);
      setType("Exercise");
      setPriority("medium");
      setProgramId(programs[0]?.id ?? "");
      setGroupId(NO_GROUP);
      setIsCreateOpen(false);
      router.refresh();
    });
  };

  return (
    <div className="space-y-4 md:space-y-6 px-2 sm:px-0">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Assignments</h1>
          <p className="text-sm text-slate-500 mt-1">Create and manage work assigned to each program</p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white hover:from-violet-600 hover:to-fuchsia-600">
              <Plus className="w-4 h-4 mr-2" />
              Create Assignment
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Assignment</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="assignmentTitle">Title</Label>
                <Input
                  id="assignmentTitle"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="assignmentProgram">Program</Label>
                <Select
                  value={programId}
                  onValueChange={(value) => {
                    setProgramId(value);
                    setGroupId(NO_GROUP);
                  }}
                >
                  <SelectTrigger id="assignmentProgram" className="w-full">
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
              <div className="space-y-2">
                <Label htmlFor="assignmentTarget">Target</Label>
                <Select value={groupId} onValueChange={setGroupId}>
                  <SelectTrigger id="assignmentTarget" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NO_GROUP}>Entire Program (individual)</SelectItem>
                    {groupsForProgram.map((group) => (
                      <SelectItem key={group.id} value={group.id}>
                        Group: {group.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="assignmentDueDate">Due Date</Label>
                  <Input
                    id="assignmentDueDate"
                    placeholder="Apr 20, 2026"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="assignmentPoints">Points</Label>
                  <Input
                    id="assignmentPoints"
                    type="number"
                    min={1}
                    value={points}
                    onChange={(e) => setPoints(Number(e.target.value))}
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="assignmentType">Type</Label>
                  <Select value={type} onValueChange={(value) => setType(value as AssignmentType)}>
                    <SelectTrigger id="assignmentType" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {assignmentTypes.map((t) => (
                        <SelectItem key={t} value={t}>
                          {t}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="assignmentPriority">Priority</Label>
                  <Select
                    value={priority}
                    onValueChange={(value) => setPriority(value as AssignmentPriority)}
                  >
                    <SelectTrigger id="assignmentPriority" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {error && (
                <p className="text-sm text-destructive" role="alert">
                  {error}
                </p>
              )}
              <DialogFooter>
                <Button type="submit" className="bg-violet-600 hover:bg-violet-700" disabled={isPending}>
                  {isPending ? "Creating..." : "Create Assignment"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {assignments.map((assignment) => (
          <Card key={assignment.id} className="border-2 hover:border-violet-200 transition-colors">
            <CardHeader className="p-5 space-y-3">
              <div className="flex items-start justify-between">
                <div className="w-10 h-10 rounded-lg bg-violet-50 flex items-center justify-center">
                  <ClipboardList className="w-5 h-5 text-violet-600" />
                </div>
                <Badge variant="secondary" className={priorityStyles[assignment.priority]}>
                  {assignment.priority}
                </Badge>
              </div>
              <div>
                <h3 className="font-medium text-slate-900">{assignment.title}</h3>
                <p className="text-sm text-slate-500">{assignment.programName}</p>
                {assignment.groupName && (
                  <Badge variant="secondary" className="mt-1 bg-sky-50 text-sky-700 hover:bg-sky-50">
                    Group: {assignment.groupName}
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-5 pt-0 space-y-2 text-sm text-slate-600">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span>Due {assignment.dueDate}</span>
              </div>
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4" />
                <span>{assignment.points} points · {assignment.type}</span>
              </div>
              <div className="pt-2">
                <Badge variant="secondary" className="bg-slate-100 text-slate-700">
                  {assignment.submissionCount} submission{assignment.submissionCount === 1 ? "" : "s"}
                </Badge>
              </div>
            </CardContent>
          </Card>
        ))}
        {assignments.length === 0 && (
          <p className="text-sm text-slate-500 py-8 text-center col-span-2">No assignments yet.</p>
        )}
      </div>
    </div>
  );
}
