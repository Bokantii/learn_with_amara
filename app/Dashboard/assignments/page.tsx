import { redirect } from "next/navigation";
import { auth } from "../../../auth";
import { prisma } from "../../../lib/prisma";
import AssignmentsClient from "./AssignmentsClient";

export default async function AssignmentsPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/SignIn");
  }

  const [enrollments, memberships] = await Promise.all([
    prisma.enrollment.findMany({
      where: { userId: session.user.id },
      select: { programId: true },
    }),
    prisma.groupMembership.findMany({
      where: { userId: session.user.id },
      select: { groupId: true },
    }),
  ]);
  const programIds = enrollments.map((e) => e.programId);
  const groupIds = memberships.map((m) => m.groupId);

  const [assignments, submissions] = await Promise.all([
    prisma.assignment.findMany({
      where: {
        programId: { in: programIds },
        OR: [{ groupId: null }, { groupId: { in: groupIds } }],
      },
      include: { program: true, group: true },
      orderBy: { dueDate: "asc" },
    }),
    prisma.submission.findMany({
      where: { studentId: session.user.id },
    }),
  ]);

  const submissionByAssignment = new Map(submissions.map((s) => [s.assignmentId, s]));

  const pending = assignments
    .filter((a) => !submissionByAssignment.has(a.id))
    .map((a) => ({
      id: a.id,
      title: a.title,
      programName: a.program.name,
      groupName: a.group?.name ?? null,
      dueDate: a.dueDate.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
      priority: a.priority as "high" | "medium" | "low",
      points: a.points,
      type: a.type,
    }));

  const submitted = assignments
    .filter((a) => submissionByAssignment.has(a.id))
    .map((a) => {
      const submission = submissionByAssignment.get(a.id)!;
      return {
        id: a.id,
        title: a.title,
        programName: a.program.name,
        groupName: a.group?.name ?? null,
        submittedDate: submission.submittedAt.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        }),
        status: submission.status as "PENDING" | "GRADED",
        score: submission.score,
        totalPoints: a.points,
        feedback: submission.feedback,
        fileUrl: submission.fileUrl,
      };
    });

  return <AssignmentsClient pending={pending} submitted={submitted} />;
}
