import Link from 'next/link';
import { redirect } from 'next/navigation';
import { QrCode, Calendar, ChevronRight } from 'lucide-react';
import { getSessionUser, isStaff } from '@/lib/authz';
import { prisma } from '@/lib/prisma';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export const dynamic = 'force-dynamic';

function formatRange(startsAt: Date, endsAt: Date) {
  const date = startsAt.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  const start = startsAt.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
  const end = endsAt.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
  return `${date} · ${start} – ${end}`;
}

export default async function AttendanceManageListPage() {
  const user = await getSessionUser();
  if (!isStaff(user)) {
    redirect('/dashboard');
  }

  const classes = await prisma.liveClass.findMany({
    where: { status: { in: ['SCHEDULED', 'COMPLETED'] } },
    include: { program: true, group: true },
    orderBy: { startsAt: 'desc' },
  });

  const scheduled = classes
    .filter((c) => c.status === 'SCHEDULED')
    .sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime());
  const completed = classes.filter((c) => c.status === 'COMPLETED');

  const renderRow = (c: (typeof classes)[number]) => (
    <Link key={c.id} href={`/attendance/manage/${c.id}`} className="block">
      <Card className="p-4 hover:shadow-md transition-shadow">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-sky-50 flex items-center justify-center flex-shrink-0">
            <QrCode className="w-5 h-5 text-sky-600" aria-hidden="true" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold text-slate-900 truncate">{c.title}</h3>
              <Badge variant="secondary" className="bg-slate-100 text-slate-700 hover:bg-slate-100 text-xs">
                {c.program.name}
                {c.group ? ` · ${c.group.name}` : ''}
              </Badge>
            </div>
            <div className="flex items-center gap-1.5 text-sm text-slate-500 mt-1">
              <Calendar className="w-3.5 h-3.5 text-sky-500" aria-hidden="true" />
              <span>{formatRange(c.startsAt, c.endsAt)}</span>
              <span className="text-slate-400">· {c.instructorName}</span>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400 flex-shrink-0" aria-hidden="true" />
        </div>
      </Card>
    </Link>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Attendance</h1>
        <p className="text-sm text-slate-500 mt-1">
          Start a QR attendance session for a class, or review its roster.
        </p>
      </div>

      <Tabs defaultValue="scheduled" className="w-full">
        <TabsList className="bg-white border border-slate-200">
          <TabsTrigger value="scheduled">Scheduled ({scheduled.length})</TabsTrigger>
          <TabsTrigger value="completed">Completed ({completed.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="scheduled" className="mt-4 space-y-3">
          {scheduled.length === 0 ? (
            <Card className="p-8 text-center text-slate-500">No scheduled classes.</Card>
          ) : (
            scheduled.map(renderRow)
          )}
        </TabsContent>
        <TabsContent value="completed" className="mt-4 space-y-3">
          {completed.length === 0 ? (
            <Card className="p-8 text-center text-slate-500">No completed classes yet.</Card>
          ) : (
            completed.map(renderRow)
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
