"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Video, Calendar, Clock, User, ExternalLink, Ban } from "lucide-react";
import { DEFAULT_MEETING_URL, CANCELLATION_REASON_LABEL, type CancellationReason } from "@/lib/liveclass";

interface LiveClassRow {
  id: string;
  title: string;
  description: string | null;
  programName: string;
  groupName: string | null;
  instructorName: string;
  startsAt: string;
  endsAt: string;
  meetingUrl: string | null;
  status: "SCHEDULED" | "COMPLETED" | "CANCELLED";
  cancellationReason: string | null;
  cancellationMessage: string | null;
  rescheduledAt: string | null;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
}

function formatTimeRange(startsAt: string, endsAt: string) {
  const start = new Date(startsAt);
  const end = new Date(endsAt);
  const startStr = start.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  const endStr = end.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  const minutes = Math.round((end.getTime() - start.getTime()) / 60000);
  return `${startStr} – ${endStr} (${minutes} min)`;
}

export default function LiveClassesClient({ liveClasses }: { liveClasses: LiveClassRow[] }) {
  const upcoming = liveClasses.filter((c) => c.status === "SCHEDULED");
  const cancelled = liveClasses.filter((c) => c.status === "CANCELLED");
  const past = liveClasses.filter((c) => c.status === "COMPLETED");

  return (
    <div className="space-y-4 md:space-y-6 px-2 sm:px-0">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Live Classes</h1>
        <p className="text-slate-600 mt-2 text-sm sm:text-base">
          Join live sessions with your instructors
        </p>
      </div>

      <Tabs defaultValue="upcoming" className="w-full">
        <TabsList className="bg-white border border-slate-200">
          <TabsTrigger value="upcoming" className="text-sm">Upcoming</TabsTrigger>
          <TabsTrigger value="past" className="text-sm">Past Classes</TabsTrigger>
          <TabsTrigger value="cancelled" className="text-sm">Cancelled</TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming" className="mt-4 md:mt-6">
          {upcoming.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-sm">No upcoming classes scheduled.</div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
              {upcoming.map((c) => (
                <Card key={c.id} className="p-4 md:p-6 hover:shadow-lg transition-shadow border-sky-200">
                  <div className="flex items-start gap-3 md:gap-4 mb-4">
                    <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg bg-gradient-to-br from-sky-400 to-cyan-500 flex items-center justify-center flex-shrink-0">
                      <Video className="w-5 h-5 md:w-6 md:h-6 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-sm md:text-lg text-slate-900 leading-snug">{c.title}</h3>
                      <div className="flex items-center gap-2 text-xs md:text-sm text-slate-600 mt-1">
                        <User className="w-3 h-3 md:w-4 md:h-4 text-sky-500 flex-shrink-0" />
                        <span className="truncate">{c.instructorName}</span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                      <Badge className="bg-sky-100 text-sky-700 hover:bg-sky-100 text-xs">Upcoming</Badge>
                      {c.rescheduledAt && (
                        <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 text-xs">Rescheduled</Badge>
                      )}
                    </div>
                  </div>

                  <div className="space-y-1.5 md:space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-xs md:text-sm text-slate-600">
                      <Calendar className="w-3.5 h-3.5 md:w-4 md:h-4 text-sky-500 flex-shrink-0" />
                      <span>{formatDate(c.startsAt)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs md:text-sm text-slate-600">
                      <Clock className="w-3.5 h-3.5 md:w-4 md:h-4 text-sky-500 flex-shrink-0" />
                      <span>{formatTimeRange(c.startsAt, c.endsAt)}</span>
                    </div>
                    <div className="text-xs md:text-sm text-slate-500">
                      {c.programName}{c.groupName ? ` · ${c.groupName}` : ""}
                    </div>
                  </div>

                  <Button
                    className="w-full bg-gradient-to-r from-sky-500 to-cyan-500 hover:from-sky-600 hover:to-cyan-600 text-white text-sm h-9 md:h-10"
                    asChild
                  >
                    <a href={c.meetingUrl ?? DEFAULT_MEETING_URL} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Join Class
                    </a>
                  </Button>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="past" className="mt-4 md:mt-6">
          {past.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-sm">No past classes yet.</div>
          ) : (
            <div className="space-y-3 md:space-y-4">
              {past.map((c) => (
                <Card key={c.id} className="p-4 md:p-6">
                  <div className="flex items-start md:items-center justify-between gap-3">
                    <div className="flex items-start gap-3 md:gap-4 flex-1 min-w-0">
                      <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
                        <Video className="w-5 h-5 md:w-6 md:h-6 text-slate-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-sm md:text-base text-slate-900 leading-snug">{c.title}</h3>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 mt-1.5 text-xs md:text-sm text-slate-600">
                          <div className="flex items-center gap-1.5">
                            <User className="w-3.5 h-3.5 flex-shrink-0" />
                            <span className="truncate">{c.instructorName}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
                            <span>{formatDate(c.startsAt)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <Badge className="bg-slate-100 text-slate-600 hover:bg-slate-100 text-xs flex-shrink-0">
                      Completed
                    </Badge>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="cancelled" className="mt-4 md:mt-6">
          {cancelled.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-sm">No cancelled classes.</div>
          ) : (
            <div className="space-y-3 md:space-y-4">
              {cancelled.map((c) => (
                <Card key={c.id} className="p-4 md:p-6 border-red-100">
                  <div className="flex items-start gap-3 md:gap-4">
                    <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg bg-red-50 flex items-center justify-center flex-shrink-0">
                      <Ban className="w-5 h-5 md:w-6 md:h-6 text-red-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-bold text-sm md:text-base text-slate-900 leading-snug">{c.title}</h3>
                        <Badge className="bg-red-100 text-red-700 hover:bg-red-100 text-xs">Cancelled</Badge>
                      </div>
                      <div className="flex items-center gap-2 text-xs md:text-sm text-slate-600 mt-1.5">
                        <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
                        <span>{formatDate(c.startsAt)}</span>
                      </div>
                      {(c.cancellationReason || c.cancellationMessage) && (
                        <p className="text-xs md:text-sm text-red-600 mt-2">
                          {c.cancellationReason && CANCELLATION_REASON_LABEL[c.cancellationReason as CancellationReason]}
                          {c.cancellationMessage ? ` — ${c.cancellationMessage}` : ""}
                        </p>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
