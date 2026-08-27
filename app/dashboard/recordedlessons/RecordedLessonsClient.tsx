"use client";

import { useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PlayCircle, Search, Clock, CheckCircle2 } from "lucide-react";

interface LessonRow {
  id: string;
  title: string;
  programName: string;
  durationMinutes: number | null;
  status: "IN_PROGRESS" | "COMPLETED" | null;
}

export default function RecordedLessonsClient({
  lessons,
  programs,
}: {
  lessons: LessonRow[];
  programs: string[];
}) {
  const [search, setSearch] = useState("");
  const [selectedProgram, setSelectedProgram] = useState("All Programs");

  const filtered = lessons.filter((lesson) => {
    const matchesSearch = lesson.title.toLowerCase().includes(search.toLowerCase());
    const matchesProgram =
      selectedProgram === "All Programs" || lesson.programName === selectedProgram;
    return matchesSearch && matchesProgram;
  });

  return (
    <div className="space-y-4 md:space-y-6 px-2 sm:px-0">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Recorded Lessons</h1>
        <p className="text-slate-600 mt-2 text-sm sm:text-base">
          Access your library of video lessons anytime
        </p>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1 sm:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Search lessons..."
            className="pl-9 text-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          value={selectedProgram}
          onChange={(e) => setSelectedProgram(e.target.value)}
          className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white"
        >
          {["All Programs", ...programs].map((p) => (
            <option key={p}>{p}</option>
          ))}
        </select>
      </div>

      {/* Lessons Grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-12 text-slate-500 text-sm">
          {lessons.length === 0
            ? "No lessons are available in your enrolled programs yet."
            : "No lessons found matching your search."}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {filtered.map((lesson) => (
            <Card key={lesson.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              {/* Thumbnail */}
              <div className="relative aspect-video bg-gradient-to-br from-sky-100 to-cyan-100 flex items-center justify-center">
                <PlayCircle className="w-10 h-10 md:w-12 md:h-12 text-sky-500" />
                {lesson.status === "COMPLETED" && (
                  <div className="absolute top-2 right-2">
                    <Badge className="bg-emerald-500 text-white hover:bg-emerald-500 text-xs">
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                      Completed
                    </Badge>
                  </div>
                )}
                {lesson.status === "IN_PROGRESS" && (
                  <div className="absolute top-2 right-2">
                    <Badge className="bg-sky-500 text-white hover:bg-sky-500 text-xs">
                      In Progress
                    </Badge>
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="p-3 md:p-4">
                <h3 className="font-bold text-sm md:text-base text-slate-900 mb-2 leading-snug">
                  {lesson.title}
                </h3>
                <div className="flex items-center gap-2 text-xs md:text-sm text-slate-600 mb-3 flex-wrap">
                  <Badge className="bg-slate-100 text-slate-700 hover:bg-slate-100 text-xs">
                    {lesson.programName}
                  </Badge>
                  {lesson.durationMinutes && (
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>{lesson.durationMinutes} min</span>
                    </div>
                  )}
                </div>

                <Button
                  asChild
                  className="w-full text-sm h-9 bg-gradient-to-r from-sky-500 to-cyan-500 hover:from-sky-600 hover:to-cyan-600 text-white"
                >
                  <Link href={`/dashboard/lesson/${lesson.id}`}>
                    {lesson.status === "COMPLETED" ? (
                      <><PlayCircle className="w-4 h-4 mr-2" />Rewatch</>
                    ) : lesson.status === "IN_PROGRESS" ? (
                      <><PlayCircle className="w-4 h-4 mr-2" />Continue</>
                    ) : (
                      <><PlayCircle className="w-4 h-4 mr-2" />Start Lesson</>
                    )}
                  </Link>
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
