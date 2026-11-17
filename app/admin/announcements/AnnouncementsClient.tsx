"use client";

import { useMemo, useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Card } from "../../../components/ui/card";
import { Badge } from "../../../components/ui/badge";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
import { Textarea } from "../../../components/ui/textarea";
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from "../../../components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger,
} from "../../../components/ui/dialog";
import {
  AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogFooter,
  AlertDialogTitle, AlertDialogDescription, AlertDialogAction, AlertDialogCancel,
} from "../../../components/ui/alert-dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "../../../components/ui/select";
import { Megaphone, Plus } from "lucide-react";
import {
  createAnnouncementAction, publishAnnouncementAction, updateAnnouncementAction,
  setAnnouncementArchivedAction, deleteAnnouncementAction,
} from "./actions";

type Scope = "ALL" | "PROGRAM" | "GROUP" | "STUDENT";
type State = "DRAFT" | "PUBLISHED" | "ARCHIVED";

interface Row {
  id: string;
  title: string;
  body: string;
  scope: string;
  scopeLabel: string;
  state: State;
  publishedAt: string | null;
  archivedAt: string | null;
  createdAt: string;
  createdByName: string;
  delivery: { reached: number; emailSkipped: number; emailFailed: number };
}
interface Option { id: string; name: string }

const STATE_BADGE: Record<State, string> = {
  DRAFT: "bg-slate-100 text-slate-600 hover:bg-slate-100",
  PUBLISHED: "bg-emerald-100 text-emerald-700 hover:bg-emerald-100",
  ARCHIVED: "bg-amber-100 text-amber-700 hover:bg-amber-100",
};

function fmt(iso: string | null) {
  return iso
    ? new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    : "—";
}

function deliveryLabel(d: Row["delivery"]) {
  if (d.reached === 0) return "—";
  const parts = [`Sent to ${d.reached}`];
  if (d.emailSkipped > 0) parts.push(`${d.emailSkipped} not emailed`);
  if (d.emailFailed > 0) parts.push(`${d.emailFailed} email failed`);
  return parts.join(" · ");
}

export default function AnnouncementsClient({
  announcements,
  programs,
  groups,
  students,
}: {
  announcements: Row[];
  programs: Option[];
  groups: Option[];
  students: { id: string; name: string; email: string }[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [createOpen, setCreateOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [scope, setScope] = useState<Scope>("ALL");
  const [targetId, setTargetId] = useState("");

  const [editTarget, setEditTarget] = useState<Row | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editBody, setEditBody] = useState("");

  const targetOptions = useMemo<Option[]>(() => {
    if (scope === "PROGRAM") return programs;
    if (scope === "GROUP") return groups;
    if (scope === "STUDENT") return students.map((s) => ({ id: s.id, name: `${s.name} (${s.email})` }));
    return [];
  }, [scope, programs, groups, students]);

  const run = (fn: () => Promise<{ serverError?: string; validationErrors?: unknown }>, after?: () => void) => {
    setError(null);
    startTransition(async () => {
      const res = await fn();
      if (res.serverError || res.validationErrors) {
        setError(res.serverError ?? "Please check the form and try again.");
        return;
      }
      after?.();
      router.refresh();
    });
  };

  const handleCreate = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    run(
      () =>
        createAnnouncementAction({
          title,
          body,
          scope,
          programId: scope === "PROGRAM" ? targetId : undefined,
          groupId: scope === "GROUP" ? targetId : undefined,
          studentId: scope === "STUDENT" ? targetId : undefined,
        }),
      () => {
        setTitle("");
        setBody("");
        setScope("ALL");
        setTargetId("");
        setCreateOpen(false);
      }
    );
  };

  return (
    <div className="space-y-4 md:space-y-6 px-2 sm:px-0">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Announcements</h1>
          <p className="text-sm text-slate-500 mt-1">
            Publish a message to all students, a program, a group, or one student
          </p>
        </div>
        <Dialog
          open={createOpen}
          onOpenChange={(o) => {
            setCreateOpen(o);
            if (!o) setError(null);
          }}
        >
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-sky-500 to-cyan-500 text-white hover:from-sky-600 hover:to-cyan-600">
              <Plus className="mr-2 h-4 w-4" />
              New announcement
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>New announcement</DialogTitle>
              <DialogDescription>
                Saved as a draft. It reaches students only when you publish it.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="a-title">Title</Label>
                <Input id="a-title" value={title} onChange={(e) => setTitle(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="a-body">Body</Label>
                <Textarea id="a-body" rows={5} value={body} onChange={(e) => setBody(e.target.value)} required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="a-scope">Audience</Label>
                  <Select
                    value={scope}
                    onValueChange={(v) => {
                      setScope(v as Scope);
                      setTargetId("");
                    }}
                  >
                    <SelectTrigger id="a-scope" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">All students</SelectItem>
                      <SelectItem value="PROGRAM">A program</SelectItem>
                      <SelectItem value="GROUP">A group</SelectItem>
                      <SelectItem value="STUDENT">One student</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {scope !== "ALL" && (
                  <div className="space-y-2">
                    <Label htmlFor="a-target">Target</Label>
                    <Select value={targetId} onValueChange={setTargetId}>
                      <SelectTrigger id="a-target" className="w-full">
                        <SelectValue placeholder="Choose…" />
                      </SelectTrigger>
                      <SelectContent>
                        {targetOptions.map((o) => (
                          <SelectItem key={o.id} value={o.id}>
                            {o.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
              {error && (
                <p className="text-sm text-destructive" role="alert">
                  {error}
                </p>
              )}
              <DialogFooter>
                <Button type="submit" className="bg-sky-600 hover:bg-sky-700" disabled={isPending}>
                  {isPending ? "Saving…" : "Create draft"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {error && !createOpen && !editTarget && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Audience</TableHead>
                <TableHead>State</TableHead>
                <TableHead>Published</TableHead>
                <TableHead>Delivery</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {announcements.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="py-8 text-center text-slate-500">
                    No announcements yet.
                  </TableCell>
                </TableRow>
              )}
              {announcements.map((a) => (
                <TableRow key={a.id}>
                  <TableCell className="font-medium text-slate-900 max-w-[16rem] truncate">
                    {a.title}
                  </TableCell>
                  <TableCell className="text-sm text-slate-600">{a.scopeLabel}</TableCell>
                  <TableCell>
                    <Badge className={STATE_BADGE[a.state]}>{a.state.toLowerCase()}</Badge>
                  </TableCell>
                  <TableCell className="text-sm text-slate-500">{fmt(a.publishedAt)}</TableCell>
                  <TableCell className="text-xs text-slate-500">{deliveryLabel(a.delivery)}</TableCell>
                  <TableCell className="text-right space-x-2 whitespace-nowrap">
                    {a.state === "DRAFT" && (
                      <>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="sm" className="bg-sky-600 hover:bg-sky-700" disabled={isPending}>
                              Publish
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Publish this announcement?</AlertDialogTitle>
                              <AlertDialogDescription>
                                &ldquo;{a.title}&rdquo; will be delivered to {a.scopeLabel} — an in-app
                                notification now, plus an email where configured. This can&apos;t be
                                undone (you can archive it afterwards).
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() =>
                                  run(() => publishAnnouncementAction({ announcementId: a.id }))
                                }
                              >
                                Publish
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-red-300 text-red-600 hover:bg-red-50"
                              disabled={isPending}
                            >
                              Delete
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete this draft?</AlertDialogTitle>
                              <AlertDialogDescription>
                                &ldquo;{a.title}&rdquo; is a draft and will be permanently removed.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() =>
                                  run(() => deleteAnnouncementAction({ announcementId: a.id }))
                                }
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={isPending}
                      onClick={() => {
                        setEditTarget(a);
                        setEditTitle(a.title);
                        setEditBody(a.body);
                        setError(null);
                      }}
                    >
                      Edit
                    </Button>
                    {a.state !== "DRAFT" && (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={isPending}
                        onClick={() =>
                          run(() =>
                            setAnnouncementArchivedAction({
                              announcementId: a.id,
                              archived: a.state !== "ARCHIVED",
                            })
                          )
                        }
                      >
                        {a.state === "ARCHIVED" ? "Unarchive" : "Archive"}
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>

      <Dialog open={!!editTarget} onOpenChange={(o) => !o && setEditTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit announcement</DialogTitle>
            <DialogDescription>
              Editing does not re-send notifications to students who already received this.
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!editTarget) return;
              run(
                () =>
                  updateAnnouncementAction({
                    announcementId: editTarget.id,
                    title: editTitle,
                    body: editBody,
                  }),
                () => setEditTarget(null)
              );
            }}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="e-title">Title</Label>
              <Input id="e-title" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="e-body">Body</Label>
              <Textarea id="e-body" rows={5} value={editBody} onChange={(e) => setEditBody(e.target.value)} required />
            </div>
            {error && (
              <p className="text-sm text-destructive" role="alert">
                {error}
              </p>
            )}
            <DialogFooter>
              <Button type="submit" className="bg-sky-600 hover:bg-sky-700" disabled={isPending}>
                {isPending ? "Saving…" : "Save changes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <p className="flex items-center gap-1.5 text-xs text-slate-400">
        <Megaphone className="h-3.5 w-3.5" />
        Published announcements are archived, never deleted.
      </p>
    </div>
  );
}
