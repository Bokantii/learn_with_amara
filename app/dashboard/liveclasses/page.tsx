import { redirect } from "next/navigation";
import { getSessionUser } from "../../../lib/authz";
import { prisma } from "../../../lib/prisma";
import { VISIBLE_ENROLLMENT_STATUSES } from "../../../lib/live-class-entitlement";
import LiveClassesClient from "./LiveClassesClient";

export default async function LiveClassesPage() {
  const user = await getSessionUser();
  if (!user?.id) {
    redirect("/SignIn");
  }

  // Authoritative live-class entitlement rule (single source of truth): a student
  // may see a live class if they have an enrollment in its Program with a VISIBLE
  // status, AND — for group-scoped classes only — are currently a member of that
  // specific Group. Group membership alone is never sufficient (a stale
  // GroupMembership must not keep granting access after the enrollment is gone).
  // The resolve-by-class inverse of this rule lives in
  // lib/live-class-entitlement.ts#entitledUserIdsForLiveClass and is shared with
  // the notification recipient resolver — which deliberately uses the NARROWER
  // NOTIFY_ENROLLMENT_STATUSES (push email is not the same as dashboard visibility).
  const enrollments = await prisma.enrollment.findMany({
    where: { userId: user.id, status: { in: VISIBLE_ENROLLMENT_STATUSES } },
    select: { programId: true },
  });
  const programIds = enrollments.map((e) => e.programId);

  const memberships = await prisma.groupMembership.findMany({
    where: { userId: user.id },
    select: { groupId: true },
  });
  const memberGroupIds = new Set(memberships.map((m) => m.groupId));

  const liveClasses = await prisma.liveClass.findMany({
    where: {
      programId: { in: programIds },
      OR: [{ groupId: null }, { groupId: { in: [...memberGroupIds] } }],
    },
    include: { program: true, group: true },
    orderBy: { startsAt: "asc" },
  });

  const rows = liveClasses.map((lc) => ({
    id: lc.id,
    title: lc.title,
    description: lc.description,
    programName: lc.program.name,
    groupName: lc.group?.name ?? null,
    instructorName: lc.instructorName,
    startsAt: lc.startsAt.toISOString(),
    endsAt: lc.endsAt.toISOString(),
    meetingUrl: lc.status === "SCHEDULED" ? lc.meetingUrl : null,
    status: lc.status,
    cancellationReason: lc.cancellationReason,
    cancellationMessage: lc.cancellationMessage,
    rescheduledAt: lc.rescheduledAt ? lc.rescheduledAt.toISOString() : null,
  }));

  return <LiveClassesClient liveClasses={rows} />;
}
