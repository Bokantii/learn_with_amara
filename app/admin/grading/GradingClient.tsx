"use client";

import { useEffect, useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Card } from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { Badge } from "../../../components/ui/badge";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
import { Textarea } from "../../../components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../../../components/ui/tabs";
import { CheckCircle2 } from "lucide-react";
import { saveGradeAction } from "./actions";

interface SubmissionRow {
  id: string;
  studentName: string;
  assignmentTitle: string;
  programName: string;
  submittedDate: string;
  status: "PENDING" | "GRADED";
  score: number | null;
  feedback: string | null;
}

function GradeForm({
  submission,
  onSave,
  isPending,
}: {
  submission: SubmissionRow;
  onSave: (score: number, feedback: string) => void;
  isPending: boolean;
}) {
  const [score, setScore] = useState("");
  const [feedback, setFeedback] = useState("");

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    onSave(Number(score), feedback);
  };

  return (
    <form onSubmit={handleSubmit} className="grid sm:grid-cols-[120px_1fr_auto] gap-3 items-start">
      <div className="space-y-1">
        <Label htmlFor={`score-${submission.id}`} className="text-xs">Score</Label>
        <Input
          id={`score-${submission.id}`}
          type="number"
          min={0}
          placeholder="0-100"
          value={score}
          onChange={(e) => setScore(e.target.value)}
          className="h-9"
          required
        />
      </div>
      <div className="space-y-1">
        <Label htmlFor={`feedback-${submission.id}`} className="text-xs">Feedback</Label>
        <Textarea
          id={`feedback-${submission.id}`}
          placeholder="Optional feedback for the student"
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          className="min-h-9 h-9"
        />
      </div>
      <Button type="submit" size="sm" className="mt-5 bg-violet-600 hover:bg-violet-700" disabled={isPending}>
        {isPending ? "Saving..." : "Save Grade"}
      </Button>
    </form>
  );
}

export default function GradingClient({ initialSubmissions }: { initialSubmissions: SubmissionRow[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [submissions, setSubmissions] = useState(initialSubmissions);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setSubmissions(initialSubmissions);
  }, [initialSubmissions]);

  const pending = submissions.filter((s) => s.status === "PENDING");
  const graded = submissions.filter((s) => s.status === "GRADED");

  const handleSaveGrade = (submissionId: string, score: number, feedback: string) => {
    setError(null);
    startTransition(async () => {
      const result = await saveGradeAction({ submissionId, score, feedback });
      if (result.serverError || result.validationErrors) {
        setError(result.serverError ?? "Please check the score and try again.");
        return;
      }
      router.refresh();
    });
  };

  return (
    <div className="space-y-4 md:space-y-6 px-2 sm:px-0">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Grading</h1>
        <p className="text-sm text-slate-500 mt-1">Review submissions and enter scores</p>
      </div>

      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}

      <Tabs defaultValue="pending">
        <TabsList>
          <TabsTrigger value="pending">Pending ({pending.length})</TabsTrigger>
          <TabsTrigger value="graded">Graded ({graded.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-3 mt-4">
          {pending.length === 0 && (
            <p className="text-sm text-slate-500 py-8 text-center">No submissions waiting to be graded.</p>
          )}
          {pending.map((submission) => (
            <Card key={submission.id} className="p-4 md:p-5">
              <div className="mb-3">
                <p className="font-medium text-slate-900">{submission.assignmentTitle}</p>
                <p className="text-sm text-slate-500">
                  {submission.studentName} · {submission.programName} · Submitted{" "}
                  {submission.submittedDate}
                </p>
              </div>
              <GradeForm
                submission={submission}
                isPending={isPending}
                onSave={(score, feedback) => handleSaveGrade(submission.id, score, feedback)}
              />
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="graded" className="space-y-3 mt-4">
          {graded.length === 0 && (
            <p className="text-sm text-slate-500 py-8 text-center">No graded submissions yet.</p>
          )}
          {graded.map((submission) => (
            <Card key={submission.id} className="p-4 md:p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-medium text-slate-900">{submission.assignmentTitle}</p>
                  <p className="text-sm text-slate-500">
                    {submission.studentName} · {submission.programName}
                  </p>
                  {submission.feedback && (
                    <p className="text-sm text-slate-600 mt-2 bg-sky-50 rounded-lg p-3">
                      {submission.feedback}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <Badge variant="secondary" className="bg-emerald-50 text-emerald-700">
                    {submission.score} pts
                  </Badge>
                </div>
              </div>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}
