import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { getSessionUser, hasProgramAccess } from "../../../../lib/authz";
import { prisma } from "../../../../lib/prisma";
import { Card } from "../../../../components/ui/card";
import { Button } from "../../../../components/ui/button";
import { PlayCircle, CheckCircle2, FolderOpen, Clock } from "lucide-react";

export default async function CoursePage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const user = await getSessionUser();
  if (!user?.id) {
    redirect("/SignIn");
  }

  const { courseId } = await params;

  const entitled = await hasProgramAccess(user.id, courseId);
  if (!entitled) {
    notFound();
  }

  const program = await prisma.program.findUnique({
    where: { id: courseId },
    include: {
      modules: {
        where: { active: true },
        orderBy: { order: "asc" },
        include: {
          lessons: {
            where: { published: true },
            orderBy: { order: "asc" },
          },
        },
      },
    },
  });

  if (!program) {
    notFound();
  }

  const lessonIds = program.modules.flatMap((m) => m.lessons.map((l) => l.id));
  const progressRecords = await prisma.lessonProgress.findMany({
    where: { userId: user.id, lessonId: { in: lessonIds } },
  });
  const progressByLesson = new Map(progressRecords.map((p) => [p.lessonId, p.status]));

  return (
    <div className="space-y-4 md:space-y-6 px-2 sm:px-0">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">{program.name}</h1>
        <p className="text-slate-600 mt-2 text-sm sm:text-base">{program.track}</p>
      </div>

      {program.modules.length === 0 ? (
        <Card className="p-8 text-center text-slate-500">No lessons available yet.</Card>
      ) : (
        <div className="space-y-4">
          {program.modules.map((mod) => (
            <Card key={mod.id} className="p-4 md:p-6">
              <div className="flex items-start gap-2 mb-3">
                <FolderOpen className="w-5 h-5 text-sky-500 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-bold text-slate-900">{mod.title}</h3>
                  {mod.description && <p className="text-sm text-slate-500 mt-1">{mod.description}</p>}
                </div>
              </div>

              {mod.lessons.length === 0 ? (
                <p className="text-sm text-slate-400 pl-7">No published lessons yet.</p>
              ) : (
                <div className="space-y-2 pl-7">
                  {mod.lessons.map((lesson) => {
                    const status = progressByLesson.get(lesson.id);
                    return (
                      <div
                        key={lesson.id}
                        className="flex items-center justify-between gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200"
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-slate-900 truncate">{lesson.title}</p>
                          {lesson.durationMinutes && (
                            <div className="flex items-center gap-1 mt-1 text-xs text-slate-500">
                              <Clock className="w-3 h-3" />
                              <span>{lesson.durationMinutes} min</span>
                            </div>
                          )}
                        </div>
                        <Button asChild size="sm" className="flex-shrink-0 bg-gradient-to-r from-sky-500 to-cyan-500 hover:from-sky-600 hover:to-cyan-600 text-white">
                          <Link href={`/dashboard/lesson/${lesson.id}`}>
                            {status === "COMPLETED" ? (
                              <><CheckCircle2 className="w-4 h-4 mr-1.5" />Rewatch</>
                            ) : status === "IN_PROGRESS" ? (
                              <><PlayCircle className="w-4 h-4 mr-1.5" />Continue</>
                            ) : (
                              <><PlayCircle className="w-4 h-4 mr-1.5" />Start</>
                            )}
                          </Link>
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
