import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "../../lib/authz";
import { prisma } from "../../lib/prisma";
import { getStudentResults } from "../../lib/results/queries";
import { getRecentStudentAnnouncements } from "../../lib/announcements/queries";
import { cefrLabel } from "../../lib/assessments/placement";
import { CONTENT_ACCESS_ENROLLMENT_STATUSES } from "../../lib/enrollment/status";
import { VISIBLE_ENROLLMENT_STATUSES } from "../../lib/live-class-entitlement";
import { DEFAULT_MEETING_URL } from "../../lib/liveclass";
import { Card } from "./../../components/ui/card";
import { Progress } from "./../../components/ui/progress";
import { Button } from "./../../components/ui/button";
import { Badge } from "./../../components/ui/badge";
import {
  Video, PlayCircle, Calendar, Clock, BookOpen,
  CheckCircle2, AlertCircle, Trophy, Target, UsersRound,
} from "lucide-react";
import WeeklyProgressChart from "./WeeklyProgressChart";

export default async function Dashboard() {
  const user = await getSessionUser();
  if (!user?.id) {
    redirect("/SignIn");
  }

  const [
    memberships,
    results,
    recentAnnouncements,
    contentEnrollments,
    visibleEnrollments,
    activeProgramsCount,
  ] = await Promise.all([
    prisma.groupMembership.findMany({
      where: { userId: user.id },
      include: { group: { include: { program: true } } },
    }),
    getStudentResults(user.id, { includeSkills: false }),
    getRecentStudentAnnouncements(user.id, 3),
    prisma.enrollment.findMany({
      where: { userId: user.id, status: { in: CONTENT_ACCESS_ENROLLMENT_STATUSES } },
      select: { programId: true },
    }),
    prisma.enrollment.findMany({
      where: { userId: user.id, status: { in: VISIBLE_ENROLLMENT_STATUSES } },
      select: { programId: true },
    }),
    prisma.enrollment.count({ where: { userId: user.id, status: "ACTIVE" } }),
  ]);

  const myGroups = memberships.map((m) => ({
    id: m.group.id,
    name: m.group.name,
    programName: m.group.program.name,
  }));
  const memberGroupIds = memberships.map((m) => m.groupId);
  const contentProgramIds = contentEnrollments.map((e) => e.programId);
  const visibleProgramIds = visibleEnrollments.map((e) => e.programId);

  const lessonWhere = {
    published: true,
    module: { programId: { in: contentProgramIds }, active: true },
  };

  const [totalLessons, completedLessons, nextLiveClass, pendingAssignments, submissions] =
    await Promise.all([
      contentProgramIds.length ? prisma.lesson.count({ where: lessonWhere }) : 0,
      contentProgramIds.length
        ? prisma.lessonProgress.count({
            where: { userId: user.id, status: "COMPLETED", lesson: lessonWhere },
          })
        : 0,
      visibleProgramIds.length
        ? prisma.liveClass.findFirst({
            where: {
              programId: { in: visibleProgramIds },
              OR: [{ groupId: null }, { groupId: { in: memberGroupIds } }],
              status: "SCHEDULED",
              startsAt: { gte: new Date() },
            },
            include: { program: true, group: true },
            orderBy: { startsAt: "asc" },
          })
        : null,
      contentProgramIds.length
        ? prisma.assignment.findMany({
            where: {
              programId: { in: contentProgramIds },
              OR: [{ groupId: null }, { groupId: { in: memberGroupIds } }],
            },
            select: { id: true, title: true, dueDate: true, priority: true },
            orderBy: { dueDate: "asc" },
          })
        : [],
      prisma.submission.findMany({ where: { studentId: user.id }, select: { assignmentId: true } }),
    ]);

  const lessonPct = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

  const submittedAssignmentIds = new Set(submissions.map((s) => s.assignmentId));
  const pendingTasks = pendingAssignments
    .filter((a) => !submittedAssignmentIds.has(a.id))
    .slice(0, 3)
    .map((a) => ({
      id: a.id,
      title: a.title,
      dueDate: a.dueDate.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
      priority: a.priority as "high" | "medium" | "low",
    }));

  const latestAttempt = results.attempts[0] ?? null;
  const latestAttemptScore =
    latestAttempt && latestAttempt.status !== "AWAITING_REVIEW"
      ? latestAttempt.assessment.type === "PLACEMENT"
        ? cefrLabel(latestAttempt.estimatedCefr)
        : (() => {
            const max = (latestAttempt.autoMaxPoints ?? 0) + (latestAttempt.manualMaxPoints ?? 0);
            const score =
              (latestAttempt.autoScorePoints ?? 0) + (latestAttempt.manualScorePoints ?? 0);
            return max > 0 ? `${Math.round((score / max) * 100)}%` : "—";
          })()
      : null;

  return (
    <div className="space-y-4 md:space-y-6 px-2 sm:px-0">

      {/* Stats Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
        <Card className="p-4 md:p-6 bg-gradient-to-br from-sky-400 to-sky-500 text-white border-0">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sky-100 text-xs md:text-sm">Overall Progress</p>
              <p className="text-2xl md:text-3xl font-bold mt-1 md:mt-2">
                {totalLessons > 0 ? `${lessonPct}%` : "—"}
              </p>
              <div className="flex items-center gap-1 mt-1 md:mt-2">
                <CheckCircle2 className="w-3 h-3 md:w-4 md:h-4" />
                <span className="text-xs md:text-sm">
                  {totalLessons > 0 ? "Based on completed lessons" : "No lessons yet"}
                </span>
              </div>
            </div>
            <div className="w-9 h-9 md:w-12 md:h-12 bg-white/20 rounded-lg flex items-center justify-center">
              <Target className="w-5 h-5 md:w-6 md:h-6" />
            </div>
          </div>
        </Card>

        <Card className="p-4 md:p-6 bg-gradient-to-br from-cyan-400 to-cyan-500 text-white border-0">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-cyan-100 text-xs md:text-sm">Active Programs</p>
              <p className="text-2xl md:text-3xl font-bold mt-1 md:mt-2">{activeProgramsCount}</p>
              <div className="flex items-center gap-1 mt-1 md:mt-2">
                <BookOpen className="w-3 h-3 md:w-4 md:h-4" />
                <span className="text-xs md:text-sm">Enrolled and active</span>
              </div>
            </div>
            <div className="w-9 h-9 md:w-12 md:h-12 bg-white/20 rounded-lg flex items-center justify-center">
              <BookOpen className="w-5 h-5 md:w-6 md:h-6" />
            </div>
          </div>
        </Card>

        <Card className="p-4 md:p-6 bg-gradient-to-br from-emerald-400 to-emerald-500 text-white border-0">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-emerald-100 text-xs md:text-sm">Completed Lessons</p>
              <p className="text-2xl md:text-3xl font-bold mt-1 md:mt-2">
                {totalLessons > 0 ? `${completedLessons}/${totalLessons}` : "—"}
              </p>
              <div className="flex items-center gap-1 mt-1 md:mt-2">
                <CheckCircle2 className="w-3 h-3 md:w-4 md:h-4" />
                <span className="text-xs md:text-sm">
                  {totalLessons > 0 ? `${lessonPct}% complete` : "No lessons yet"}
                </span>
              </div>
              {totalLessons > 0 && (
                <Progress value={lessonPct} className="h-1.5 mt-2 bg-white/30" />
              )}
            </div>
            <div className="w-9 h-9 md:w-12 md:h-12 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
              <PlayCircle className="w-5 h-5 md:w-6 md:h-6" />
            </div>
          </div>
        </Card>

        <Card className="p-4 md:p-6 bg-gradient-to-br from-amber-400 to-amber-500 text-white border-0">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-amber-100 text-xs md:text-sm">Assignment average</p>
              <p className="text-2xl md:text-3xl font-bold mt-1 md:mt-2">
                {results.assignmentAverage === null ? "—" : `${results.assignmentAverage}%`}
              </p>
              <div className="flex items-center gap-1 mt-1 md:mt-2">
                <Trophy className="w-3 h-3 md:w-4 md:h-4" />
                <span className="text-xs md:text-sm">
                  {results.assignmentGrades.length > 0
                    ? `${results.assignmentGrades.length} graded`
                    : "No grades yet"}
                </span>
              </div>
            </div>
            <div className="w-9 h-9 md:w-12 md:h-12 bg-white/20 rounded-lg flex items-center justify-center">
              <Trophy className="w-5 h-5 md:w-6 md:h-6" />
            </div>
          </div>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">

        {/* Left Column */}
        <div className="lg:col-span-2 space-y-4 md:space-y-6">

          {/* Next Live Class */}
          <Card className="p-4 md:p-6 border-sky-200 bg-gradient-to-br from-sky-50 to-white">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="font-bold text-base md:text-lg text-slate-900">Next Live Class</h3>
                <p className="text-xs md:text-sm text-slate-500 mt-1">
                  {nextLiveClass ? "Get ready for your upcoming session" : "Nothing scheduled right now"}
                </p>
              </div>
              {nextLiveClass && (
                <Badge className="bg-sky-100 text-sky-700 hover:bg-sky-100 text-xs">Upcoming</Badge>
              )}
            </div>
            {nextLiveClass ? (
              <div className="bg-white rounded-lg border border-sky-100 p-3 md:p-4">
                <div className="flex items-start gap-3 md:gap-4">
                  <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg bg-gradient-to-br from-sky-400 to-cyan-500 flex items-center justify-center flex-shrink-0">
                    <Video className="w-5 h-5 md:w-6 md:h-6 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-sm md:text-base text-slate-900">{nextLiveClass.title}</h4>
                    <p className="text-xs md:text-sm text-slate-600 mt-1">
                      With {nextLiveClass.instructorName}
                      {" · "}
                      {nextLiveClass.group ? nextLiveClass.group.name : nextLiveClass.program.name}
                    </p>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mt-3">
                      <div className="flex items-center gap-2 text-xs md:text-sm text-slate-600">
                        <Calendar className="w-3 h-3 md:w-4 md:h-4 text-sky-500 flex-shrink-0" />
                        <span>
                          {nextLiveClass.startsAt.toLocaleDateString("en-US", {
                            weekday: "long",
                            month: "long",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs md:text-sm text-slate-600">
                        <Clock className="w-3 h-3 md:w-4 md:h-4 text-sky-500 flex-shrink-0" />
                        <span>
                          {nextLiveClass.startsAt.toLocaleTimeString("en-US", {
                            hour: "numeric",
                            minute: "2-digit",
                          })}
                          {" – "}
                          {nextLiveClass.endsAt.toLocaleTimeString("en-US", {
                            hour: "numeric",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                    </div>
                    <div className="mt-4">
                      <Button
                        asChild
                        className="bg-gradient-to-r from-sky-500 to-cyan-500 hover:from-sky-600 hover:to-cyan-600 text-white text-sm h-9"
                      >
                        <a
                          href={nextLiveClass.meetingUrl ?? DEFAULT_MEETING_URL}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Video className="w-4 h-4 mr-2" />
                          Join Class
                        </a>
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-sm text-slate-500">No upcoming live class scheduled.</p>
                <Button asChild variant="outline" size="sm" className="mt-3">
                  <Link href="/dashboard/liveclasses">View live classes</Link>
                </Button>
              </div>
            )}
          </Card>

          {/* Assignment score trend */}
          <Card className="p-4 md:p-6">
            <h3 className="font-bold text-base md:text-lg text-slate-900 mb-4">
              Assignment score trend
            </h3>
            {results.trend ? (
              <WeeklyProgressChart
                data={results.trend.map((p) => ({ week: p.label, score: p.percent }))}
              />
            ) : (
              <p className="text-sm text-slate-500 py-8 text-center">
                Not enough graded work yet to show a trend.
              </p>
            )}
          </Card>
        </div>

        {/* Right Column */}
        <div className="space-y-4 md:space-y-6">

          {/* My Group(s) */}
          <Card className="p-4 md:p-6">
            <h3 className="font-bold text-base md:text-lg text-slate-900 mb-4">My Group{myGroups.length === 1 ? "" : "s"}</h3>
            {myGroups.length === 0 ? (
              <p className="text-xs md:text-sm text-slate-500">
                You haven&apos;t been added to a group yet.
              </p>
            ) : (
              <div className="space-y-2 md:space-y-3">
                {myGroups.map((group) => (
                  <div
                    key={group.id}
                    className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200"
                  >
                    <div className="w-9 h-9 rounded-lg bg-violet-100 flex items-center justify-center flex-shrink-0">
                      <UsersRound className="w-4 h-4 text-violet-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs md:text-sm font-medium text-slate-900 truncate">{group.name}</p>
                      <Badge className="mt-1 bg-sky-100 text-sky-700 hover:bg-sky-100 text-xs">
                        {group.programName}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Tasks Due */}
          <Card className="p-4 md:p-6">
            <h3 className="font-bold text-base md:text-lg text-slate-900 mb-4">Tasks Due</h3>
            {pendingTasks.length === 0 ? (
              <p className="text-xs md:text-sm text-slate-500 py-4 text-center">
                Nothing due — you&apos;re all caught up!
              </p>
            ) : (
              <div className="space-y-2 md:space-y-3">
                {pendingTasks.map((task) => (
                  <div
                    key={task.id}
                    className="p-3 bg-slate-50 rounded-lg border border-slate-200 hover:border-sky-300 transition-colors"
                  >
                    <div className="flex items-start gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs md:text-sm font-medium text-slate-900 leading-snug">{task.title}</p>
                        <div className="flex items-center gap-1 mt-1.5">
                          <Clock className="w-3 h-3 text-slate-400 flex-shrink-0" />
                          <span className="text-xs text-slate-500">Due {task.dueDate}</span>
                        </div>
                      </div>
                      <Badge
                        className={`text-xs flex-shrink-0 ${
                          task.priority === "high"
                            ? "bg-red-100 text-red-700 hover:bg-red-100"
                            : task.priority === "medium"
                            ? "bg-amber-100 text-amber-700 hover:bg-amber-100"
                            : "bg-slate-100 text-slate-700 hover:bg-slate-100"
                        }`}
                      >
                        {task.priority === "high" && <AlertCircle className="w-3 h-3 mr-1" />}
                        {task.priority}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Latest Assessment Result */}
          <Card className="p-4 md:p-6">
            <h3 className="font-bold text-base md:text-lg text-slate-900 mb-4">
              Latest Assessment Result
            </h3>
            {latestAttempt ? (
              <div>
                <p className="text-sm font-medium text-slate-900">
                  {latestAttempt.assessment.title}
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  {latestAttempt.assessment.type === "PLACEMENT" ? "Placement" : "Practice"}
                  {latestAttempt.submittedAt
                    ? ` · ${latestAttempt.submittedAt.toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}`
                    : ""}
                </p>
                <div className="mt-3 pt-3 border-t border-slate-200 flex items-center justify-between">
                  <span className="font-bold text-slate-900 text-sm md:text-base">
                    {latestAttempt.assessment.type === "PLACEMENT" ? "Estimated level" : "Score"}
                  </span>
                  {latestAttemptScore ? (
                    <span className="text-xl md:text-2xl font-bold text-sky-600">
                      {latestAttemptScore}
                    </span>
                  ) : (
                    <Badge className="bg-amber-100 text-amber-800 text-xs">Awaiting review</Badge>
                  )}
                </div>
                <Button asChild variant="outline" size="sm" className="mt-4 w-full">
                  <Link href={`/assessments/result/${latestAttempt.id}`}>View details</Link>
                </Button>
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-sm text-slate-500">No assessment results yet.</p>
                <Button asChild variant="outline" size="sm" className="mt-3">
                  <Link href="/assessments">Take a practice test</Link>
                </Button>
              </div>
            )}
          </Card>

          {/* Announcements */}
          <Card className="p-4 md:p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-bold text-base md:text-lg text-slate-900">Announcements</h3>
              <Link
                href="/dashboard/announcements"
                className="text-xs text-sky-600 hover:underline"
              >
                View all
              </Link>
            </div>
            {recentAnnouncements.length === 0 ? (
              <p className="text-xs md:text-sm text-slate-500">No announcements yet.</p>
            ) : (
              <div className="space-y-3 md:space-y-4">
                {recentAnnouncements.map((announcement) => (
                  <div
                    key={announcement.id}
                    className="pb-3 border-b border-slate-200 last:border-0 last:pb-0"
                  >
                    <h4 className="font-medium text-slate-900 text-xs md:text-sm">
                      {announcement.title}
                    </h4>
                    <p className="text-xs text-slate-600 mt-1 line-clamp-2">{announcement.body}</p>
                    <p className="text-xs text-slate-400 mt-1.5">
                      {announcement.publishedAt.toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
