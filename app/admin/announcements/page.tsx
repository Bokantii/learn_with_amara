import { redirect } from "next/navigation";
import { getSessionUser } from "../../../lib/authz";
import { prisma } from "../../../lib/prisma";
import { listAdminAnnouncements } from "../../../lib/announcements/queries";
import AnnouncementsClient from "./AnnouncementsClient";

export const dynamic = "force-dynamic";

export default async function AdminAnnouncementsPage() {
  const user = await getSessionUser();
  if (user?.role !== "ADMIN") {
    redirect("/SignIn");
  }

  const [announcements, programs, groups, students] = await Promise.all([
    listAdminAnnouncements(),
    prisma.program.findMany({ where: { active: true }, orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.group.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true, program: { select: { name: true } } },
    }),
    prisma.user.findMany({
      where: { role: "STUDENT" },
      orderBy: { name: "asc" },
      select: { id: true, name: true, email: true },
    }),
  ]);

  return (
    <AnnouncementsClient
      announcements={announcements.map((a) => ({
        ...a,
        publishedAt: a.publishedAt ? a.publishedAt.toISOString() : null,
        archivedAt: a.archivedAt ? a.archivedAt.toISOString() : null,
        createdAt: a.createdAt.toISOString(),
      }))}
      programs={programs}
      groups={groups.map((g) => ({ id: g.id, name: `${g.name} (${g.program.name})` }))}
      students={students}
    />
  );
}
