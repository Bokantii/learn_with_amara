import { redirect } from "next/navigation";
import { getSessionUser } from "../../../lib/authz";
import { prisma } from "../../../lib/prisma";
import LiveClassesClient from "./LiveClassesClient";

export default async function LiveClassesPage() {
  const user = await getSessionUser();
  if (!user?.id) {
    redirect("/SignIn");
  }

  // Authoritative live-class entitlement rule (single source of truth — do not
  // duplicate this logic elsewhere): a student may see a live class if they have
  // a non-cancelled enrollment in its Program (matches lib/authz.ts#hasProgramAccess'
  // semantics, expressed here as a bulk "which programs am I in" query since this
  // is a list page, not a per-record check), AND — for group-scoped classes only —
  // are currently a member of that specific Group. Group membership alone is never
  // sufficient, since a stale GroupMembership row (e.g. after enrollment is later
  // cancelled) must not keep granting access on its own.
  const enrollments = await prisma.enrollment.findMany({
    where: { userId: user.id, status: { not: "CANCELLED" } },
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
