import Link from "next/link";
import { redirect } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Trophy, TrendingUp, Award, Eye, ClipboardList, GraduationCap } from "lucide-react";
import { getSessionUser, hasActiveEnrollment } from "@/lib/authz";
import { getStudentResults } from "@/lib/results/queries";
import { hasMeaningfulSkillData } from "@/lib/results/analytics";
import { cefrLabel } from "@/lib/assessments/placement";
import ResultsCharts from "./ResultsCharts";

export const dynamic = "force-dynamic";

function fmtDate(d: Date) {
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default async function Results() {
  const user = await getSessionUser();
  if (!user?.id) {
    redirect("/SignIn");
  }
  // Defense-in-depth: the dashboard layout already swaps in the onboarding state
  // for an unenrolled user, but don't run the result queries without a
  // page-level entitlement check of our own.
  if (!(await hasActiveEnrollment(user.id))) {
    redirect("/dashboard");
  }

  const data = await getStudentResults(user.id);

  return (
    <div className="space-y-4 md:space-y-6 px-2 sm:px-0">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Results</h1>
        <p className="text-slate-600 mt-2 text-sm sm:text-base">
          Your graded assignments and assessment results
        </p>
      </div>

      {data.isEmpty ? (
        <Card className="p-8 md:p-12 text-center">
          <div className="w-14 h-14 mx-auto rounded-full bg-sky-100 flex items-center justify-center mb-4">
            <Award className="w-7 h-7 text-sky-600" />
          </div>
          <h2 className="text-lg font-bold text-slate-900">No graded work yet</h2>
          <p className="text-sm text-slate-500 mt-2 max-w-md mx-auto">
            Once an instructor grades an assignment, or you complete an assessment, your results and
            progress will show up here.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Button asChild variant="outline">
              <Link href="/dashboard/assignments">View assignments</Link>
            </Button>
            <Button asChild className="bg-sky-600 hover:bg-sky-700">
              <Link href="/assessments">Practice tests</Link>
            </Button>
          </div>
        </Card>
      ) : (
        <>
          {/* Stats — real values only */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-6">
            <Card className="p-4 md:p-6 bg-gradient-to-br from-sky-400 to-sky-500 text-white border-0">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sky-100 text-xs md:text-sm">Assignment average</p>
                  <p className="text-2xl md:text-3xl font-bold mt-1 md:mt-2">
                    {data.assignmentAverage === null ? "—" : `${data.assignmentAverage}%`}
                  </p>
                  <p className="text-xs md:text-sm mt-1 md:mt-2 text-sky-100">
                    {data.assignmentGrades.length > 0
                      ? `Across ${data.assignmentGrades.length} graded ${
                          data.assignmentGrades.length === 1 ? "assignment" : "assignments"
                        }`
                      : "No graded assignments yet"}
                  </p>
                </div>
                <div className="w-10 h-10 md:w-12 md:h-12 bg-white/20 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 md:w-6 md:h-6" />
                </div>
              </div>
            </Card>

            <Card className="p-4 md:p-6 bg-gradient-to-br from-emerald-400 to-emerald-500 text-white border-0">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-emerald-100 text-xs md:text-sm">Graded items</p>
                  <p className="text-2xl md:text-3xl font-bold mt-1 md:mt-2">
                    {data.gradedItemCount}
                  </p>
                  <p className="text-xs md:text-sm mt-1 md:mt-2 text-emerald-100">
                    {data.assignmentGrades.length} assignment
                    {data.assignmentGrades.length === 1 ? "" : "s"} · {data.attempts.length}{" "}
                    assessment{data.attempts.length === 1 ? "" : "s"}
                  </p>
                </div>
                <div className="w-10 h-10 md:w-12 md:h-12 bg-white/20 rounded-lg flex items-center justify-center">
                  <Award className="w-5 h-5 md:w-6 md:h-6" />
                </div>
              </div>
            </Card>

            {data.latestPlacement && (
              <Card className="p-4 md:p-6 bg-gradient-to-br from-cyan-400 to-cyan-500 text-white border-0">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-cyan-100 text-xs md:text-sm">Latest placement level</p>
                    <p className="text-2xl md:text-3xl font-bold mt-1 md:mt-2">
                      {data.latestPlacement.status === "AWAITING_REVIEW"
                        ? "In review"
                        : cefrLabel(data.latestPlacement.estimatedCefr)}
                    </p>
                    <p className="text-xs md:text-sm mt-1 md:mt-2 text-cyan-100">
                      ICLP estimate — not an official exam score
                    </p>
                  </div>
                  <div className="w-10 h-10 md:w-12 md:h-12 bg-white/20 rounded-lg flex items-center justify-center">
                    <Trophy className="w-5 h-5 md:w-6 md:h-6" />
                  </div>
                </div>
              </Card>
            )}
          </div>

          {/* Charts — rendered only when there is enough real data */}
          <ResultsCharts
            trend={data.trend}
            skills={hasMeaningfulSkillData(data.skillBreakdown) ? data.skillBreakdown : []}
          />

          {/* Graded assignments */}
          <div>
            <h2 className="font-bold text-base md:text-lg text-slate-900 mb-4">Graded assignments</h2>
            {data.assignmentGrades.length === 0 ? (
              <Card className="p-6 text-center text-sm text-slate-500">
                None of your assignments have been graded yet.
              </Card>
            ) : (
              <div className="space-y-3">
                {data.assignmentGrades.map((a, i) => (
                  <Card key={`${a.title}-${i}`} className="p-4 md:p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex items-start gap-3">
                        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-emerald-100">
                          <ClipboardList className="h-5 w-5 text-emerald-600" />
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-bold text-sm md:text-base text-slate-900 leading-snug">
                            {a.title}
                          </h4>
                          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                            <Badge className="bg-sky-100 text-sky-700 hover:bg-sky-100">
                              {a.programName}
                            </Badge>
                            <span>Submitted {fmtDate(a.submittedAt)}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className="text-xl md:text-2xl font-bold text-emerald-600">
                          {a.score}/{a.points}
                        </div>
                        <div className="text-xs text-slate-500">{a.percent}%</div>
                      </div>
                    </div>
                    <div className="mt-3">
                      <Progress value={a.percent} className="h-1.5 md:h-2 bg-slate-200" />
                    </div>
                    {a.feedback && (
                      <div className="mt-3 rounded-lg border border-sky-200 bg-sky-50 p-3">
                        <p className="text-sm text-slate-700">
                          <span className="font-medium">Feedback: </span>
                          {a.feedback}
                        </p>
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Assessment results */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-base md:text-lg text-slate-900">Assessment results</h2>
              <Link
                href="/assessments/history"
                className="text-sm text-sky-600 hover:underline whitespace-nowrap"
              >
                Full history
              </Link>
            </div>
            {data.attempts.length === 0 ? (
              <Card className="p-6 text-center text-sm text-slate-500">
                You haven&apos;t completed any assessments yet.
              </Card>
            ) : (
              <div className="space-y-3">
                {data.scoring.manual.max > 0 && (
                  <p className="text-xs text-slate-500">
                    Across your assessments: auto-scored {data.scoring.objective.score}/
                    {data.scoring.objective.max} · instructor-graded {data.scoring.manual.score}/
                    {data.scoring.manual.max}
                    {data.scoring.manual.pending ? " (some still in review)" : ""}.
                  </p>
                )}
                {data.attempts.map((att) => {
                  const totalScore = (att.autoScorePoints ?? 0) + (att.manualScorePoints ?? 0);
                  const totalMax = (att.autoMaxPoints ?? 0) + (att.manualMaxPoints ?? 0);
                  return (
                    <Card key={att.id} className="p-4">
                      <div className="flex items-center justify-between gap-3 flex-wrap">
                        <div className="min-w-0 flex items-start gap-3">
                          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-sky-100">
                            <GraduationCap className="h-5 w-5 text-sky-600" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-slate-900 truncate">
                              {att.assessment.title}
                            </p>
                            <p className="text-xs text-slate-500 mt-0.5">
                              {att.assessment.type === "PLACEMENT" ? "Placement" : "Practice"}
                              {att.submittedAt ? ` · ${fmtDate(att.submittedAt)}` : ""}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          {att.status === "AWAITING_REVIEW" ? (
                            <Badge className="bg-amber-100 text-amber-800 text-xs">
                              Awaiting review
                            </Badge>
                          ) : att.assessment.type === "PLACEMENT" ? (
                            <span className="text-sm font-semibold text-sky-700">
                              {cefrLabel(att.estimatedCefr)}
                            </span>
                          ) : (
                            <span className="text-sm font-semibold text-sky-700">
                              {totalMax > 0 ? `${Math.round((totalScore / totalMax) * 100)}%` : "—"}
                            </span>
                          )}
                          <Button
                            asChild
                            variant="outline"
                            size="sm"
                            className="border-sky-300 text-sky-600 hover:bg-sky-50"
                          >
                            <Link href={`/assessments/result/${att.id}`}>
                              <Eye className="w-3.5 h-3.5 md:w-4 md:h-4 mr-2" />
                              View Details
                            </Link>
                          </Button>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
