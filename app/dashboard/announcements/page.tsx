import { redirect } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Megaphone } from "lucide-react";
import { getSessionUser } from "@/lib/authz";
import { listStudentAnnouncements } from "@/lib/announcements/queries";

export const dynamic = "force-dynamic";

function fmt(d: Date) {
  return d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

export default async function AnnouncementsPage() {
  const user = await getSessionUser();
  if (!user?.id) {
    redirect("/SignIn");
  }

  const announcements = await listStudentAnnouncements(user.id);

  return (
    <div className="space-y-4 md:space-y-6 px-2 sm:px-0">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Announcements</h1>
        <p className="text-slate-600 mt-2 text-sm sm:text-base">
          Updates from the ICLP team for you and your programs
        </p>
      </div>

      {announcements.length === 0 ? (
        <Card className="p-8 md:p-12 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-sky-100">
            <Megaphone className="h-7 w-7 text-sky-600" />
          </div>
          <h2 className="text-lg font-bold text-slate-900">No announcements yet</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
            When the ICLP team posts an update for you, your program, or your group, it will appear
            here.
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {announcements.map((a) => (
            <Card key={a.id} className="p-5 md:p-6">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <h2 className="text-lg font-bold text-slate-900">{a.title}</h2>
                <Badge className="bg-sky-100 text-sky-700 hover:bg-sky-100">{a.scopeLabel}</Badge>
              </div>
              <p className="mt-1 text-xs text-slate-400">{fmt(a.publishedAt)}</p>
              <p className="mt-3 text-sm text-slate-700 whitespace-pre-line">{a.body}</p>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
