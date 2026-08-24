"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Card } from "../../../components/ui/card";
import { Badge } from "../../../components/ui/badge";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../../components/ui/tabs";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger,
} from "../../../components/ui/dialog";
import {
  ClipboardList, Clock, CheckCircle2, AlertCircle, Calendar, Hourglass, Paperclip,
} from "lucide-react";
import { submitAssignmentAction } from "./actions";

type Priority = "high" | "medium" | "low";

interface PendingAssignment {
  id: string;
  title: string;
  programName: string;
  groupName: string | null;
  dueDate: string;
  priority: Priority;
  points: number;
  type: string;
}

interface SubmittedAssignment {
  id: string;
  title: string;
  programName: string;
  groupName: string | null;
  submittedDate: string;
  status: "PENDING" | "GRADED";
  score: number | null;
  totalPoints: number;
  feedback: string | null;
  fileUrl: string | null;
}

const priorityStyles: Record<Priority, { badge: string; iconBox: string; icon: string }> = {
  high: { badge: "bg-red-100 text-red-700 hover:bg-red-100", iconBox: "bg-red-100", icon: "text-red-600" },
  medium: { badge: "bg-amber-100 text-amber-700 hover:bg-amber-100", iconBox: "bg-amber-100", icon: "text-amber-600" },
  low: { badge: "bg-slate-100 text-slate-700 hover:bg-slate-100", iconBox: "bg-slate-100", icon: "text-slate-600" },
};

export default function AssignmentsClient({
  pending,
  submitted,
}: {
  pending: PendingAssignment[];
  submitted: SubmittedAssignment[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [submitTarget, setSubmitTarget] = useState<PendingAssignment | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await submitAssignmentAction(formData);
      if (result?.error) {
        setError(result.error);
        return;
      }
      setSubmitTarget(null);
      router.refresh();
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Assignments</h1>
        <p className="mt-2 text-slate-600">
          Complete your assignments and track your submissions
        </p>
      </div>

      <Tabs defaultValue="pending" className="w-full">
        <TabsList className="border border-slate-200 bg-white">
          <TabsTrigger value="pending">
            Pending
            <Badge className="ml-2 bg-sky-500 text-white hover:bg-sky-500">
              {pending.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="completed">Submitted</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="mt-6">
          <div className="space-y-4">
            {pending.length === 0 && (
              <p className="text-sm text-slate-500 py-8 text-center">
                Nothing pending — you're all caught up!
              </p>
            )}
            {pending.map((assignment) => {
              const styles = priorityStyles[assignment.priority];
              return (
                <Card key={assignment.id} className="p-6 transition-shadow hover:shadow-lg">
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div className="flex flex-1 items-start gap-4">
                      <div
                        className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg ${styles.iconBox}`}
                      >
                        <ClipboardList className={`h-6 w-6 ${styles.icon}`} />
                      </div>
                      <div className="flex-1">
                        <div className="mb-2 flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                          <h3 className="text-lg font-bold text-slate-900">{assignment.title}</h3>
                          <Badge className={styles.badge}>
                            {assignment.priority === "high" && <AlertCircle className="mr-1 h-3 w-3" />}
                            {assignment.priority}
                          </Badge>
                        </div>
                        <div className="mb-4 flex flex-wrap items-center gap-3 text-sm text-slate-600">
                          <Badge className="bg-sky-100 text-sky-700 hover:bg-sky-100">
                            {assignment.programName}
                          </Badge>
                          {assignment.groupName && (
                            <Badge className="bg-violet-100 text-violet-700 hover:bg-violet-100">
                              Group: {assignment.groupName}
                            </Badge>
                          )}
                          <Badge className="bg-slate-100 text-slate-700 hover:bg-slate-100">
                            {assignment.type}
                          </Badge>
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4 text-sky-500" />
                            <span>Due {assignment.dueDate}</span>
                          </div>
                          <span className="font-medium">{assignment.points} points</span>
                        </div>
                        <Button
                          className="bg-gradient-to-r from-sky-500 to-cyan-500 text-white hover:from-sky-600 hover:to-cyan-600"
                          onClick={() => setSubmitTarget(assignment)}
                        >
                          Start Assignment
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="completed" className="mt-6">
          <div className="space-y-4">
            {submitted.length === 0 && (
              <p className="text-sm text-slate-500 py-8 text-center">No submissions yet.</p>
            )}
            {submitted.map((assignment) => (
              <Card key={assignment.id} className="p-6">
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div className="flex flex-1 items-start gap-4">
                    <div
                      className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg ${
                        assignment.status === "GRADED" ? "bg-emerald-100" : "bg-sky-100"
                      }`}
                    >
                      {assignment.status === "GRADED" ? (
                        <CheckCircle2 className="h-6 w-6 text-emerald-600" />
                      ) : (
                        <Hourglass className="h-6 w-6 text-sky-600" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="mb-2 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                        <h3 className="font-bold text-slate-900">{assignment.title}</h3>
                        <div className="flex items-center gap-2">
                          {assignment.status === "GRADED" ? (
                            <>
                              <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
                                Graded
                              </Badge>
                              <div className="text-right">
                                <div className="text-2xl font-bold text-emerald-600">
                                  {assignment.score}/{assignment.totalPoints}
                                </div>
                                <div className="text-xs text-slate-500">
                                  {Math.round(((assignment.score ?? 0) / assignment.totalPoints) * 100)}%
                                </div>
                              </div>
                            </>
                          ) : (
                            <Badge className="bg-sky-100 text-sky-700 hover:bg-sky-100">
                              Awaiting grading
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="mb-3 flex flex-wrap items-center gap-4 text-sm text-slate-600">
                        <Badge className="bg-sky-100 text-sky-700 hover:bg-sky-100">
                          {assignment.programName}
                        </Badge>
                        {assignment.groupName && (
                          <Badge className="bg-violet-100 text-violet-700 hover:bg-violet-100">
                            Group: {assignment.groupName}
                          </Badge>
                        )}
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          <span>Submitted: {assignment.submittedDate}</span>
                        </div>
                      </div>
                      {assignment.feedback && (
                        <div className="mb-3 rounded-lg border border-sky-200 bg-sky-50 p-3">
                          <p className="text-sm text-slate-700">
                            <span className="font-medium">Feedback: </span>
                            {assignment.feedback}
                          </p>
                        </div>
                      )}
                      {assignment.fileUrl && (
                        <Button variant="outline" className="border-slate-300" asChild>
                          <a href={assignment.fileUrl} target="_blank" rel="noopener noreferrer">
                            <Paperclip className="h-4 w-4 mr-2" />
                            View Submission
                          </a>
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={!!submitTarget} onOpenChange={(open) => !open && setSubmitTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Submit: {submitTarget?.title}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <input type="hidden" name="assignmentId" value={submitTarget?.id ?? ""} />
            <div className="space-y-2">
              <Label htmlFor="file">Upload your work</Label>
              <Input id="file" name="file" type="file" required />
              <p className="text-xs text-muted-foreground">PDF, document, image, or audio file.</p>
            </div>
            {error && (
              <p className="text-sm text-destructive" role="alert">
                {error}
              </p>
            )}
            <DialogFooter>
              <Button type="submit" className="bg-sky-600 hover:bg-sky-700" disabled={isPending}>
                {isPending ? "Uploading..." : "Submit Assignment"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
