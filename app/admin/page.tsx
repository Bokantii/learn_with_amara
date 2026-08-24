import Link from "next/link";
import { Card } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Users, ClipboardList, GraduationCap, BookOpen, ArrowRight } from "lucide-react";
import { prisma } from "../../lib/prisma";

export default async function AdminOverview() {
  const [totalStudents, activeStudents, totalPrograms, totalAssignments, pendingSubmissions] =
    await Promise.all([
      prisma.user.count({ where: { role: "STUDENT" } }),
      prisma.enrollment.count({ where: { status: "ACTIVE" } }),
      prisma.program.count(),
      prisma.assignment.count(),
      prisma.submission.findMany({
        where: { status: "PENDING" },
        include: { student: true, assignment: true },
        orderBy: { submittedAt: "asc" },
      }),
    ]);

  return (
    <div className="space-y-4 md:space-y-6 px-2 sm:px-0">
      {/* Stats Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
        <Card className="p-4 md:p-6 bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white border-0">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-violet-100 text-xs md:text-sm">Total Students</p>
              <p className="text-2xl md:text-3xl font-bold mt-1 md:mt-2">{totalStudents}</p>
              <p className="text-xs md:text-sm mt-1 md:mt-2">{activeStudents} active</p>
            </div>
            <div className="w-9 h-9 md:w-12 md:h-12 bg-white/20 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 md:w-6 md:h-6" />
            </div>
          </div>
        </Card>

        <Card className="p-4 md:p-6 bg-gradient-to-br from-sky-400 to-sky-500 text-white border-0">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sky-100 text-xs md:text-sm">Active Programs</p>
              <p className="text-2xl md:text-3xl font-bold mt-1 md:mt-2">{totalPrograms}</p>
            </div>
            <div className="w-9 h-9 md:w-12 md:h-12 bg-white/20 rounded-lg flex items-center justify-center">
              <BookOpen className="w-5 h-5 md:w-6 md:h-6" />
            </div>
          </div>
        </Card>

        <Card className="p-4 md:p-6 bg-gradient-to-br from-cyan-400 to-cyan-500 text-white border-0">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-cyan-100 text-xs md:text-sm">Assignments</p>
              <p className="text-2xl md:text-3xl font-bold mt-1 md:mt-2">{totalAssignments}</p>
            </div>
            <div className="w-9 h-9 md:w-12 md:h-12 bg-white/20 rounded-lg flex items-center justify-center">
              <ClipboardList className="w-5 h-5 md:w-6 md:h-6" />
            </div>
          </div>
        </Card>

        <Card className="p-4 md:p-6 bg-gradient-to-br from-amber-400 to-amber-500 text-white border-0">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-amber-100 text-xs md:text-sm">Needs Grading</p>
              <p className="text-2xl md:text-3xl font-bold mt-1 md:mt-2">{pendingSubmissions.length}</p>
            </div>
            <div className="w-9 h-9 md:w-12 md:h-12 bg-white/20 rounded-lg flex items-center justify-center">
              <GraduationCap className="w-5 h-5 md:w-6 md:h-6" />
            </div>
          </div>
        </Card>
      </div>

      {/* Needs Grading */}
      <Card className="p-4 md:p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-slate-900">Needs Grading</h2>
          <Button asChild variant="ghost" size="sm" className="text-violet-600 hover:bg-violet-50">
            <Link href="/admin/grading">
              View all <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
          </Button>
        </div>
        <div className="space-y-3">
          {pendingSubmissions.length === 0 && (
            <p className="text-sm text-slate-500">Nothing pending — great work!</p>
          )}
          {pendingSubmissions.map((submission) => (
            <div
              key={submission.id}
              className="flex items-center justify-between p-3 rounded-lg border border-slate-200 hover:bg-slate-50"
            >
              <div>
                <p className="text-sm font-medium text-slate-900">{submission.assignment.title}</p>
                <p className="text-xs text-slate-500">
                  {submission.student.name} · Submitted{" "}
                  {submission.submittedAt.toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </p>
              </div>
              <Badge variant="secondary" className="bg-amber-50 text-amber-700">
                Pending
              </Badge>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
