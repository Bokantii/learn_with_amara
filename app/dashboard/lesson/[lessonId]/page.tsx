import { notFound, redirect } from "next/navigation";
import { getSessionUser, getEntitledPublishedLesson } from "../../../../lib/authz";
import { prisma } from "../../../../lib/prisma";
import LessonClient from "./LessonClient";

export default async function LessonPage({
  params,
}: {
  params: Promise<{ lessonId: string }>;
}) {
  const user = await getSessionUser();
  if (!user?.id) {
    redirect("/SignIn");
  }

  const { lessonId } = await params;

  const lesson = await getEntitledPublishedLesson(user.id, lessonId);
  if (!lesson) {
    notFound();
  }

  const [resources, progress] = await Promise.all([
    prisma.lessonResource.findMany({ where: { lessonId }, orderBy: { order: "asc" } }),
    prisma.lessonProgress.findUnique({
      where: { userId_lessonId: { userId: user.id, lessonId } },
    }),
  ]);

  return (
    <div className="space-y-2 px-2 sm:px-0">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">{lesson.title}</h1>
        {lesson.description && (
          <p className="text-slate-600 mt-2 text-sm sm:text-base">{lesson.description}</p>
        )}
      </div>

      <LessonClient
        lessonId={lesson.id}
        courseId={lesson.module.programId}
        videoUrl={lesson.videoUrl}
        resources={resources}
        alreadyCompleted={progress?.status === "COMPLETED"}
      />
    </div>
  );
}
