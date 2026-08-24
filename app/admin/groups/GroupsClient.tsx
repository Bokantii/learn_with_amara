"use client";

import { useEffect, useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Card } from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { Badge } from "../../../components/ui/badge";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
import { Checkbox } from "../../../components/ui/checkbox";
import { ScrollArea } from "../../../components/ui/scroll-area";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger,
} from "../../../components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "../../../components/ui/select";
import { UsersRound, Trash2, Settings2 } from "lucide-react";
import { createGroupAction, deleteGroupAction, updateGroupMembersAction } from "./actions";

interface GroupRow {
  id: string;
  name: string;
  programId: string;
  programName: string;
  memberCount: number;
}

interface ProgramOption {
  id: string;
  name: string;
}

interface StudentOption {
  id: string;
  name: string;
  email: string;
  programIds: string[];
}

export default function GroupsClient({
  initialGroups,
  programs,
  students,
  membersByGroup,
}: {
  initialGroups: GroupRow[];
  programs: ProgramOption[];
  students: StudentOption[];
  membersByGroup: Record<string, string[]>;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [groups, setGroups] = useState(initialGroups);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [manageTarget, setManageTarget] = useState<GroupRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<GroupRow | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [programId, setProgramId] = useState(programs[0]?.id ?? "");
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);

  useEffect(() => {
    setGroups(initialGroups);
  }, [initialGroups]);

  useEffect(() => {
    if (manageTarget) {
      setSelectedMemberIds(membersByGroup[manageTarget.id] ?? []);
    }
  }, [manageTarget, membersByGroup]);

  const handleCreate = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await createGroupAction({ name, programId });
      if (result.serverError || result.validationErrors) {
        setError(result.serverError ?? "Please check the form and try again.");
        return;
      }
      setName("");
      setProgramId(programs[0]?.id ?? "");
      setIsCreateOpen(false);
      router.refresh();
    });
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    setError(null);
    startTransition(async () => {
      const result = await deleteGroupAction({ groupId: deleteTarget.id });
      if (result.serverError) {
        setError(result.serverError);
        return;
      }
      setDeleteTarget(null);
      router.refresh();
    });
  };

  const handleSaveMembers = () => {
    if (!manageTarget) return;
    setError(null);
    startTransition(async () => {
      const result = await updateGroupMembersAction({
        groupId: manageTarget.id,
        studentIds: selectedMemberIds,
      });
      if (result.serverError) {
        setError(result.serverError);
        return;
      }
      setManageTarget(null);
      router.refresh();
    });
  };

  const toggleMember = (studentId: string) => {
    setSelectedMemberIds((prev) =>
      prev.includes(studentId) ? prev.filter((id) => id !== studentId) : [...prev, studentId]
    );
  };

  const eligibleStudents = manageTarget
    ? students.filter((s) => s.programIds.includes(manageTarget.programId))
    : [];

  return (
    <div className="space-y-4 md:space-y-6 px-2 sm:px-0">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Groups</h1>
          <p className="text-sm text-slate-500 mt-1">Manage student groups and their membership</p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white hover:from-violet-600 hover:to-fuchsia-600">
              <UsersRound className="w-4 h-4 mr-2" />
              Create Group
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Group</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="groupName">Name</Label>
                <Input
                  id="groupName"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="groupProgram">Program</Label>
                <Select value={programId} onValueChange={setProgramId}>
                  <SelectTrigger id="groupProgram" className="w-full">
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
                  {isPending ? "Creating..." : "Create Group"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {groups.map((group) => (
          <Card key={group.id} className="p-4 md:p-5 space-y-3">
            <div>
              <p className="font-medium text-slate-900">{group.name}</p>
              <Badge variant="secondary" className="mt-1 bg-sky-50 text-sky-700 hover:bg-sky-50">
                {group.programName}
              </Badge>
            </div>
            <p className="text-sm text-slate-500">
              {group.memberCount} {group.memberCount === 1 ? "member" : "members"}
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => setManageTarget(group)}
              >
                <Settings2 className="w-4 h-4 mr-2" />
                Manage Members
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="border-red-300 text-red-600 hover:bg-red-50"
                onClick={() => setDeleteTarget(group)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </Card>
        ))}
        {groups.length === 0 && (
          <p className="text-sm text-slate-500 py-8 text-center col-span-full">
            No groups yet. Create one to get started.
          </p>
        )}
      </div>

      <Dialog open={!!manageTarget} onOpenChange={(open) => !open && setManageTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Manage Members — {manageTarget?.name}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-slate-500">
            Showing students enrolled in {manageTarget?.programName}.
          </p>
          <ScrollArea className="h-72 rounded-md border p-3">
            <div className="space-y-3">
              {eligibleStudents.map((student) => (
                <div key={student.id} className="flex items-center gap-3">
                  <Checkbox
                    id={`member-${student.id}`}
                    checked={selectedMemberIds.includes(student.id)}
                    onCheckedChange={() => toggleMember(student.id)}
                  />
                  <Label htmlFor={`member-${student.id}`} className="flex-1 cursor-pointer">
                    <span className="text-slate-900">{student.name}</span>{" "}
                    <span className="text-slate-500">{student.email}</span>
                  </Label>
                </div>
              ))}
              {eligibleStudents.length === 0 && (
                <p className="text-sm text-slate-500 py-4 text-center">
                  No students enrolled in this program yet.
                </p>
              )}
            </div>
          </ScrollArea>
          {error && (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setManageTarget(null)}>
              Cancel
            </Button>
            <Button
              className="bg-violet-600 hover:bg-violet-700"
              onClick={handleSaveMembers}
              disabled={isPending}
            >
              {isPending ? "Saving..." : "Save Members"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete {deleteTarget?.name}?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-slate-500">
            This removes the group and its membership. Any assignments targeted at this group
            become program-wide instead of being deleted. This can&apos;t be undone.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isPending}>
              {isPending ? "Deleting..." : "Delete Group"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
