"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Card } from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { Badge } from "../../../components/ui/badge";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
import { Textarea } from "../../../components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../../components/ui/tabs";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger,
} from "../../../components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "../../../components/ui/select";
import { Plus, Pencil, Ban, CheckCircle2, Calendar } from "lucide-react";
import {
  createLiveClassAction, updateLiveClassAction, cancelLiveClassAction, markLiveClassCompletedAction,
} from "./actions";
import {
  DEFAULT_MEETING_URL, CANCELLATION_REASON_LABEL, CANCELLATION_REASONS, type CancellationReason,
} from "../../../lib/liveclass";

interface LiveClassRow {
  id: string;
  programId: string;
  programName: string;
  groupId: string | null;
  groupName: string | null;
  title: string;
  description: string | null;
  instructorName: string;
  startsAt: string;
  endsAt: string;
  meetingUrl: string | null;
  status: "SCHEDULED" | "COMPLETED" | "CANCELLED";
  cancellationReason: string | null;
  cancellationMessage: string | null;
  rescheduledAt: string | null;
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

function toLocalInputParts(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  const date = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const time = `${pad(d.getHours())}:${pad(d.getMinutes())}`;
  return { date, time };
}

export default function LiveClassesClient({
  initialLiveClasses,
  programs,
  groups,
}: {
  initialLiveClasses: LiveClassRow[];
  programs: ProgramOption[];
  groups: GroupOption[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const liveClasses = initialLiveClasses;

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<LiveClassRow | null>(null);
  const [cancelTarget, setCancelTarget] = useState<LiveClassRow | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [programId, setProgramId] = useState("");
  const [groupId, setGroupId] = useState<string>("none");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [instructorName, setInstructorName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endDate, setEndDate] = useState("");
  const [endTime, setEndTime] = useState("");
  const [meetingUrl, setMeetingUrl] = useState("");

  const [cancellationReason, setCancellationReason] = useState<CancellationReason>(CANCELLATION_REASONS[0]);
  const [cancellationMessage, setCancellationMessage] = useState("");

  const groupsForProgram = (pid: string) => groups.filter((g) => g.programId === pid);

  const resetForm = () => {
    setProgramId(programs[0]?.id ?? "");
    setGroupId("none");
    setTitle("");
    setDescription("");
    setInstructorName("");
    setStartDate("");
    setStartTime("");
    setEndDate("");
    setEndTime("");
    setMeetingUrl("");
    setError(null);
  };

  const openEdit = (lc: LiveClassRow) => {
    setProgramId(lc.programId);
    setGroupId(lc.groupId ?? "none");
    setTitle(lc.title);
    setDescription(lc.description ?? "");
    setInstructorName(lc.instructorName);
    const start = toLocalInputParts(lc.startsAt);
    const end = toLocalInputParts(lc.endsAt);
    setStartDate(start.date);
    setStartTime(start.time);
    setEndDate(end.date);
    setEndTime(end.time);
    setMeetingUrl(lc.meetingUrl ?? "");
    setError(null);
    setEditTarget(lc);
  };

  const handleCreate = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await createLiveClassAction({
        programId,
        groupId: groupId === "none" ? undefined : groupId,
        title,
        description,
        instructorName,
        startsAt: new Date(`${startDate}T${startTime}`).toISOString(),
        endsAt: new Date(`${endDate}T${endTime}`).toISOString(),
        meetingUrl,
      });
      if (result.serverError || result.validationErrors) {
        setError(result.serverError ?? "Please check the form and try again.");
        return;
      }
      setIsCreateOpen(false);
      resetForm();
      router.refresh();
    });
  };

  const handleUpdate = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editTarget) return;
    setError(null);
    startTransition(async () => {
      const result = await updateLiveClassAction({
        liveClassId: editTarget.id,
        programId,
        groupId: groupId === "none" ? undefined : groupId,
        title,
        description,
        instructorName,
        startsAt: new Date(`${startDate}T${startTime}`).toISOString(),
        endsAt: new Date(`${endDate}T${endTime}`).toISOString(),
        meetingUrl,
      });
      if (result.serverError || result.validationErrors) {
        setError(result.serverError ?? "Please check the form and try again.");
        return;
      }
      setEditTarget(null);
      router.refresh();
    });
  };

  const handleCancel = () => {
    if (!cancelTarget) return;
    setError(null);
    startTransition(async () => {
      const result = await cancelLiveClassAction({
        liveClassId: cancelTarget.id,
        cancellationReason,
        cancellationMessage,
      });
      if (result.serverError) {
        setError(result.serverError);
        return;
      }
      setCancelTarget(null);
      setCancellationReason(CANCELLATION_REASONS[0]);
      setCancellationMessage("");
      router.refresh();
    });
  };

  const handleMarkCompleted = (liveClassId: string) => {
    startTransition(async () => {
      await markLiveClassCompletedAction({ liveClassId });
      router.refresh();
    });
  };

  const formatRange = (startsAt: string, endsAt: string) => {
    const start = new Date(startsAt);
    const end = new Date(endsAt);
    const dateStr = start.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
    const startTimeStr = start.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
    const endTimeStr = end.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
    return `${dateStr} · ${startTimeStr} – ${endTimeStr}`;
  };

  const scheduled = liveClasses
    .filter((c) => c.status === "SCHEDULED")
    .sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime());
  const completed = liveClasses.filter((c) => c.status === "COMPLETED");
  const cancelled = liveClasses.filter((c) => c.status === "CANCELLED");

  const renderFormFields = () => (
    <>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="lcProgram">Program</Label>
          <Select
            value={programId}
            onValueChange={(value) => {
              setProgramId(value);
              setGroupId("none");
            }}
          >
            <SelectTrigger id="lcProgram" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {programs.map((p) => (
                <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="lcGroup">Group (optional)</Label>
          <Select value={groupId} onValueChange={setGroupId}>
            <SelectTrigger id="lcGroup" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Entire program</SelectItem>
              {groupsForProgram(programId).map((g) => (
                <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="lcTitle">Title</Label>
        <Input id="lcTitle" value={title} onChange={(e) => setTitle(e.target.value)} required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="lcDescription">Description</Label>
        <Textarea id="lcDescription" value={description} onChange={(e) => setDescription(e.target.value)} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="lcInstructor">Instructor</Label>
        <Input id="lcInstructor" value={instructorName} onChange={(e) => setInstructorName(e.target.value)} required />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="lcStartDate">Start date</Label>
          <Input id="lcStartDate" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="lcStartTime">Start time</Label>
          <Input id="lcStartTime" type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} required />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="lcEndDate">End date</Label>
          <Input id="lcEndDate" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="lcEndTime">End time</Label>
          <Input id="lcEndTime" type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} required />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="lcMeetingUrl">Meeting URL</Label>
        <Input
          id="lcMeetingUrl"
          type="url"
          placeholder={DEFAULT_MEETING_URL}
          value={meetingUrl}
          onChange={(e) => setMeetingUrl(e.target.value)}
        />
        <p className="text-xs text-slate-500">Leave blank to use the institution&apos;s default Zoom link.</p>
      </div>
    </>
  );

  const renderClassCard = (lc: LiveClassRow) => (
    <Card key={lc.id} className="p-4 md:p-6">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-bold text-slate-900">{lc.title}</h3>
            {lc.status === "CANCELLED" && (
              <Badge className="bg-red-100 text-red-700 hover:bg-red-100 text-xs">cancelled</Badge>
            )}
            {lc.status === "COMPLETED" && (
              <Badge className="bg-slate-100 text-slate-600 hover:bg-slate-100 text-xs">completed</Badge>
            )}
            {lc.status === "SCHEDULED" && lc.rescheduledAt && (
              <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 text-xs">rescheduled</Badge>
            )}
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-500 mt-1 flex-wrap">
            <Badge variant="secondary" className="bg-slate-100 text-slate-700 hover:bg-slate-100 text-xs">
              {lc.programName}{lc.groupName ? ` · ${lc.groupName}` : ""}
            </Badge>
            <span>{lc.instructorName}</span>
          </div>
          <div className="flex items-center gap-1.5 text-sm text-slate-600 mt-2">
            <Calendar className="w-3.5 h-3.5 text-sky-500" />
            <span>{formatRange(lc.startsAt, lc.endsAt)}</span>
          </div>
          {lc.status === "CANCELLED" && (
            <p className="text-sm text-red-600 mt-2">
              {lc.cancellationReason && CANCELLATION_REASON_LABEL[lc.cancellationReason as CancellationReason]}
              {lc.cancellationMessage ? ` — ${lc.cancellationMessage}` : ""}
            </p>
          )}
        </div>
        {lc.status === "SCHEDULED" && (
          <div className="flex items-center gap-1 flex-shrink-0">
            <Button variant="outline" size="sm" aria-label={`Edit ${lc.title}`} onClick={() => openEdit(lc)}>
              <Pencil className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              aria-label={`Mark ${lc.title} completed`}
              className="border-emerald-300 text-emerald-600 hover:bg-emerald-50"
              onClick={() => handleMarkCompleted(lc.id)}
              disabled={isPending}
            >
              <CheckCircle2 className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              aria-label={`Cancel ${lc.title}`}
              className="border-red-300 text-red-600 hover:bg-red-50"
              onClick={() => {
                setCancellationReason(CANCELLATION_REASONS[0]);
                setCancellationMessage("");
                setError(null);
                setCancelTarget(lc);
              }}
            >
              <Ban className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>
    </Card>
  );

  return (
    <div className="space-y-4 md:space-y-6 px-2 sm:px-0">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Live Classes</h1>
          <p className="text-sm text-slate-500 mt-1">Schedule and manage live sessions</p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={(open) => { setIsCreateOpen(open); if (open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white hover:from-violet-600 hover:to-fuchsia-600">
              <Plus className="w-4 h-4 mr-2" />
              Schedule Class
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Schedule Live Class</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              {renderFormFields()}
              {error && <p className="text-sm text-destructive" role="alert">{error}</p>}
              <DialogFooter>
                <Button type="submit" className="bg-violet-600 hover:bg-violet-700" disabled={isPending}>
                  {isPending ? "Scheduling..." : "Schedule Class"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="upcoming" className="w-full">
        <TabsList className="bg-white border border-slate-200">
          <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
          <TabsTrigger value="cancelled">Cancelled</TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming" className="mt-4 space-y-4">
          {scheduled.length === 0 ? (
            <Card className="p-8 text-center text-slate-500">No upcoming classes.</Card>
          ) : (
            scheduled.map(renderClassCard)
          )}
        </TabsContent>
        <TabsContent value="completed" className="mt-4 space-y-4">
          {completed.length === 0 ? (
            <Card className="p-8 text-center text-slate-500">No completed classes yet.</Card>
          ) : (
            completed.map(renderClassCard)
          )}
        </TabsContent>
        <TabsContent value="cancelled" className="mt-4 space-y-4">
          {cancelled.length === 0 ? (
            <Card className="p-8 text-center text-slate-500">No cancelled classes.</Card>
          ) : (
            cancelled.map(renderClassCard)
          )}
        </TabsContent>
      </Tabs>

      {/* Edit / Reschedule */}
      <Dialog open={!!editTarget} onOpenChange={(open) => !open && setEditTarget(null)}>
        <DialogContent className="max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Live Class</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdate} className="space-y-4">
            {renderFormFields()}
            {error && <p className="text-sm text-destructive" role="alert">{error}</p>}
            <DialogFooter>
              <Button variant="outline" type="button" onClick={() => setEditTarget(null)}>Cancel</Button>
              <Button type="submit" className="bg-violet-600 hover:bg-violet-700" disabled={isPending}>
                {isPending ? "Saving..." : "Save"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Cancel class */}
      <Dialog open={!!cancelTarget} onOpenChange={(open) => !open && setCancelTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel {cancelTarget?.title}?</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="cancellationReason">Reason</Label>
              <Select
                value={cancellationReason}
                onValueChange={(value) => setCancellationReason(value as CancellationReason)}
              >
                <SelectTrigger id="cancellationReason" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CANCELLATION_REASONS.map((reason) => (
                    <SelectItem key={reason} value={reason}>{CANCELLATION_REASON_LABEL[reason]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="cancellationMessage">Message to students (optional)</Label>
              <Textarea
                id="cancellationMessage"
                value={cancellationMessage}
                onChange={(e) => setCancellationMessage(e.target.value)}
                placeholder="Today's class has been cancelled because..."
              />
            </div>
            {error && <p className="text-sm text-destructive" role="alert">{error}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelTarget(null)}>Back</Button>
            <Button variant="destructive" onClick={handleCancel} disabled={isPending}>
              {isPending ? "Cancelling..." : "Cancel Class"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
