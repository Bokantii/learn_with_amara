"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { PlayCircle, Search, Clock, CheckCircle2, Lock } from "lucide-react";

const lessons = [
  {
    id: 1,
    title: "French Grammar - Subjunctive Mood",
    program: "TCF Preparation",
    duration: "45 min",
    progress: 60,
    status: "in-progress",
  },
  {
    id: 2,
    title: "TEF Listening Practice - Part 1",
    program: "TEF Canada Preparation",
    duration: "30 min",
    progress: 35,
    status: "in-progress",
  },
  {
    id: 3,
    title: "French Pronunciation Guide",
    program: "TCF Preparation",
    duration: "25 min",
    progress: 100,
    status: "completed",
  },
  {
    id: 4,
    title: "TCF Reading Comprehension Strategies",
    program: "TCF Preparation",
    duration: "40 min",
    progress: 100,
    status: "completed",
  },
  {
    id: 5,
    title: "French Verb Conjugation - Present Tense",
    program: "TCF Preparation",
    duration: "35 min",
    progress: 0,
    status: "not-started",
  },
  {
    id: 6,
    title: "Advanced French Vocabulary",
    program: "TEF Canada Preparation",
    duration: "50 min",
    progress: 0,
    status: "locked",
  },
];

const programs = [
  "All Programs",
  "TCF Preparation",
  "TEF Canada Preparation",
  "Business Spanish",
  "HSK 3 Preparation",
];

export default function RecordedLessons() {
  const [search, setSearch] = useState("");
  const [selectedProgram, setSelectedProgram] = useState("All Programs");

  const filtered = lessons.filter((lesson) => {
    const matchesSearch = lesson.title.toLowerCase().includes(search.toLowerCase());
    const matchesProgram =
      selectedProgram === "All Programs" || lesson.program === selectedProgram;
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
          {programs.map((p) => (
            <option key={p}>{p}</option>
          ))}
        </select>
      </div>

      {/* Lessons Grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-12 text-slate-500 text-sm">
          No lessons found matching your search.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {filtered.map((lesson) => (
            <Card key={lesson.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              {/* Thumbnail */}
              <div className="relative aspect-video bg-gradient-to-br from-sky-100 to-cyan-100 flex items-center justify-center">
                {lesson.status === "locked" ? (
                  <Lock className="w-10 h-10 md:w-12 md:h-12 text-slate-400" />
                ) : (
                  <PlayCircle className="w-10 h-10 md:w-12 md:h-12 text-sky-500" />
                )}
                {lesson.status === "completed" && (
                  <div className="absolute top-2 right-2">
                    <Badge className="bg-emerald-500 text-white hover:bg-emerald-500 text-xs">
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                      Completed
                    </Badge>
                  </div>
                )}
                {lesson.status === "in-progress" && (
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
                    {lesson.program}
                  </Badge>
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>{lesson.duration}</span>
                  </div>
                </div>

                {lesson.progress > 0 && lesson.progress < 100 && (
                  <div className="mb-3">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-slate-600">Progress</span>
                      <span className="font-medium text-sky-600">{lesson.progress}%</span>
                    </div>
                    <Progress value={lesson.progress} className="h-1.5 bg-slate-200" />
                  </div>
                )}

                <Button
                  className={`w-full text-sm h-9 ${
                    lesson.status === "locked"
                      ? "bg-slate-200 text-slate-500 cursor-not-allowed hover:bg-slate-200"
                      : "bg-gradient-to-r from-sky-500 to-cyan-500 hover:from-sky-600 hover:to-cyan-600 text-white"
                  }`}
                  disabled={lesson.status === "locked"}
                >
                  {lesson.status === "locked" ? (
                    <><Lock className="w-4 h-4 mr-2" />Locked</>
                  ) : lesson.status === "completed" ? (
                    <><PlayCircle className="w-4 h-4 mr-2" />Rewatch</>
                  ) : lesson.status === "in-progress" ? (
                    <><PlayCircle className="w-4 h-4 mr-2" />Continue</>
                  ) : (
                    <><PlayCircle className="w-4 h-4 mr-2" />Start Lesson</>
                  )}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}