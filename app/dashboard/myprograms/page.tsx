import { redirect } from "next/navigation";
import { getSessionUser } from "../../../lib/authz";
import { prisma } from "../../../lib/prisma";
import { Card } from "../../../components/ui/card";
import { Badge } from "../../../components/ui/badge";
import { BookOpen } from "lucide-react";

const STATUS_LABEL: Record<string, string> = {
  PENDING: "pending",
  ACTIVE: "active",
  PAUSED: "paused",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
};

const STATUS_BADGE_CLASS: Record<string, string> = {
  PENDING: "bg-slate-100 text-slate-600 hover:bg-slate-100",
  ACTIVE: "bg-emerald-100 text-emerald-700 hover:bg-emerald-100",
  PAUSED: "bg-amber-100 text-amber-700 hover:bg-amber-100",
  COMPLETED: "bg-sky-100 text-sky-700 hover:bg-sky-100",
  CANCELLED: "bg-red-100 text-red-700 hover:bg-red-100",
};

export default async function MyPrograms() {
  const user = await getSessionUser();
  if (!user?.id) {
    redirect("/SignIn");
  }

  const enrollments = await prisma.enrollment.findMany({
    where: { userId: user.id },
    include: { program: true },
    orderBy: { joinedAt: "asc" },
  });

  return (
    <div className="space-y-6 px-2 sm:px-0">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">My Programs</h1>
        <p className="text-slate-600 mt-2 text-sm sm:text-base">
          Programs you&apos;re enrolled in
        </p>
      </div>

      {enrollments.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-slate-500">You&apos;re not enrolled in any programs yet.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
          {enrollments.map((enrollment) => (
            <Card key={enrollment.id} className="p-4 md:p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start gap-3 md:gap-4">
                  <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg bg-gradient-to-br from-sky-400 to-cyan-500 flex items-center justify-center flex-shrink-0">
                    <BookOpen className="w-5 h-5 md:w-6 md:h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base md:text-lg text-slate-900 leading-snug">
                      {enrollment.program.name}
                    </h3>
                    <Badge className="bg-slate-100 text-slate-700 hover:bg-slate-100 text-xs mt-1">
                      {enrollment.program.track}
                    </Badge>
                  </div>
                </div>
                <Badge className={`text-xs flex-shrink-0 ${STATUS_BADGE_CLASS[enrollment.status]}`}>
                  {STATUS_LABEL[enrollment.status]}
                </Badge>
              </div>
              <p className="text-xs md:text-sm text-slate-500">
                Enrolled{" "}
                {enrollment.joinedAt.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </p>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
