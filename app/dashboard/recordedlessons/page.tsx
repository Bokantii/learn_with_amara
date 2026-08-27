import { redirect } from "next/navigation";
import { getSessionUser } from "../../../lib/authz";
import { prisma } from "../../../lib/prisma";
import RecordedLessonsClient from "./RecordedLessonsClient";

export default async function RecordedLessonsPage() {
  const user = await getSessionUser();
  if (!user?.id) {
    redirect("/SignIn");
  }

  const enrollments = await prisma.enrollment.findMany({
    where: { userId: user.id, status: { not: "CANCELLED" } },
    select: { programId: true, program: { select: { name: true } } },
  });
  const programIds = enrollments.map((e) => e.programId);

  const lessons = await prisma.lesson.findMany({
    where: {
      published: true,
      module: { active: true, programId: { in: programIds } },
    },
    include: {
      module: { include: { program: true } },
      progress: { where: { userId: user.id } },
    },
    orderBy: [{ module: { order: "asc" } }, { order: "asc" }],
  });

  const rows = lessons.map((lesson) => ({
    id: lesson.id,
    title: lesson.title,
    programName: lesson.module.program.name,
    durationMinutes: lesson.durationMinutes,
    status: lesson.progress[0]?.status ?? null,
  }));

  const programNames = [...new Set(enrollments.map((e) => e.program.name))];

  return <RecordedLessonsClient lessons={rows} programs={programNames} />;
}
