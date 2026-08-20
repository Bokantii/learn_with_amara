'use client'
import { Card } from "./../../components/ui/card";
import { Progress } from "./../../components/ui/progress";
import { Button } from "./../../components/ui/button";
import { Badge } from "./../../components/ui/badge";
import {
  Video, PlayCircle, Calendar, Clock, TrendingUp,
  CheckCircle2, AlertCircle, Trophy, Target,
} from "lucide-react";
import {
  CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, XAxis, YAxis,
} from "recharts";

const progressData = [
  { week: "W1", score: 65 },
  { week: "W2", score: 72 },
  { week: "W3", score: 78 },
  { week: "W4", score: 85 },
  { week: "W5", score: 88 },
];

const mockTestResults = [
  { section: "Reading", score: 88, total: 100 },
  { section: "Writing", score: 82, total: 100 },
  { section: "Listening", score: 90, total: 100 },
  { section: "Speaking", score: 85, total: 100 },
];

const upcomingTasks = [
  { id: 1, title: "French Grammar Exercise - Les Temps", due: "Today, 6:00 PM", priority: "high" },
  { id: 2, title: "TCF Mock Test - Reading", due: "Tomorrow, 4:00 PM", priority: "medium" },
  { id: 3, title: "Conversation Practice Assignment", due: "Mar 15, 2026", priority: "low" },
  { id: 4, title: "TEF Vocabulary Quiz", due: "Mar 16, 2026", priority: "medium" },
];

const announcements = [
  {
    id: 1,
    title: "New TCF Practice Tests Available",
    message: "We've added 5 new practice tests for TCF exam preparation.",
    date: "Mar 12, 2026",
  },
  {
    id: 2,
    title: "Live Workshop: Advanced French Grammar",
    message: "Join us this Saturday for an intensive grammar workshop.",
    date: "Mar 11, 2026",
  },
];

export default function Dashboard() {
  return (
    <div className="space-y-4 md:space-y-6 px-2 sm:px-0">

      {/* Stats Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
        <Card className="p-4 md:p-6 bg-gradient-to-br from-sky-400 to-sky-500 text-white border-0">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sky-100 text-xs md:text-sm">Overall Progress</p>
              <p className="text-2xl md:text-3xl font-bold mt-1 md:mt-2">78%</p>
              <div className="flex items-center gap-1 mt-1 md:mt-2">
                <TrendingUp className="w-3 h-3 md:w-4 md:h-4" />
                <span className="text-xs md:text-sm">+12% this month</span>
              </div>
            </div>
            <div className="w-9 h-9 md:w-12 md:h-12 bg-white/20 rounded-lg flex items-center justify-center">
              <Target className="w-5 h-5 md:w-6 md:h-6" />
            </div>
          </div>
        </Card>

        <Card className="p-4 md:p-6 bg-gradient-to-br from-cyan-400 to-cyan-500 text-white border-0">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-cyan-100 text-xs md:text-sm">Study Hours</p>
              <p className="text-2xl md:text-3xl font-bold mt-1 md:mt-2">42.5</p>
              <div className="flex items-center gap-1 mt-1 md:mt-2">
                <Clock className="w-3 h-3 md:w-4 md:h-4" />
                <span className="text-xs md:text-sm">This month</span>
              </div>
            </div>
            <div className="w-9 h-9 md:w-12 md:h-12 bg-white/20 rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5 md:w-6 md:h-6" />
            </div>
          </div>
        </Card>

        <Card className="p-4 md:p-6 bg-gradient-to-br from-emerald-400 to-emerald-500 text-white border-0">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-emerald-100 text-xs md:text-sm">Completed Lessons</p>
              <p className="text-2xl md:text-3xl font-bold mt-1 md:mt-2">24/32</p>
              <div className="flex items-center gap-1 mt-1 md:mt-2">
                <CheckCircle2 className="w-3 h-3 md:w-4 md:h-4" />
                <span className="text-xs md:text-sm">75% complete</span>
              </div>
            </div>
            <div className="w-9 h-9 md:w-12 md:h-12 bg-white/20 rounded-lg flex items-center justify-center">
              <PlayCircle className="w-5 h-5 md:w-6 md:h-6" />
            </div>
          </div>
        </Card>

        <Card className="p-4 md:p-6 bg-gradient-to-br from-amber-400 to-amber-500 text-white border-0">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-amber-100 text-xs md:text-sm">Average Score</p>
              <p className="text-2xl md:text-3xl font-bold mt-1 md:mt-2">86.3</p>
              <div className="flex items-center gap-1 mt-1 md:mt-2">
                <Trophy className="w-3 h-3 md:w-4 md:h-4" />
                <span className="text-xs md:text-sm">Excellent!</span>
              </div>
            </div>
            <div className="w-9 h-9 md:w-12 md:h-12 bg-white/20 rounded-lg flex items-center justify-center">
              <Trophy className="w-5 h-5 md:w-6 md:h-6" />
            </div>
          </div>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">

        {/* Left Column */}
        <div className="lg:col-span-2 space-y-4 md:space-y-6">

          {/* Next Live Class */}
          <Card className="p-4 md:p-6 border-sky-200 bg-gradient-to-br from-sky-50 to-white">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="font-bold text-base md:text-lg text-slate-900">Next Live Class</h3>
                <p className="text-xs md:text-sm text-slate-500 mt-1">Get ready for your upcoming session</p>
              </div>
              <Badge className="bg-sky-100 text-sky-700 hover:bg-sky-100 text-xs">Upcoming</Badge>
            </div>
            <div className="bg-white rounded-lg border border-sky-100 p-3 md:p-4">
              <div className="flex items-start gap-3 md:gap-4">
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg bg-gradient-to-br from-sky-400 to-cyan-500 flex items-center justify-center flex-shrink-0">
                  <Video className="w-5 h-5 md:w-6 md:h-6 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-sm md:text-base text-slate-900">TCF Preparation - Speaking Module</h4>
                  <p className="text-xs md:text-sm text-slate-600 mt-1">With Amarachi Nwankpa</p>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mt-3">
                    <div className="flex items-center gap-2 text-xs md:text-sm text-slate-600">
                      <Calendar className="w-3 h-3 md:w-4 md:h-4 text-sky-500 flex-shrink-0" />
                      <span>Today, March 13, 2026</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs md:text-sm text-slate-600">
                      <Clock className="w-3 h-3 md:w-4 md:h-4 text-sky-500 flex-shrink-0" />
                      <span>4:00 PM - 5:30 PM</span>
                    </div>
                  </div>
                  <div className="mt-4">
                    <Button className="bg-gradient-to-r from-sky-500 to-cyan-500 hover:from-sky-600 hover:to-cyan-600 text-white text-sm h-9">
                      <Video className="w-4 h-4 mr-2" />
                      Join on Zoom
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Continue Learning */}
          <Card className="p-4 md:p-6">
            <h3 className="font-bold text-base md:text-lg text-slate-900 mb-4">Continue Learning</h3>
            <div className="space-y-3 md:space-y-4">
              {[
                {
                  title: "French Grammar - Subjunctive Mood",
                  subtitle: "Lesson 18 of 32 • 45 minutes remaining",
                  progress: 60,
                  color: "from-cyan-400 to-cyan-500",
                },
                {
                  title: "TEF Listening Practice",
                  subtitle: "Lesson 12 of 28 • 30 minutes remaining",
                  progress: 35,
                  color: "from-sky-400 to-sky-500",
                },
              ].map((lesson) => (
                <div
                  key={lesson.title}
                  className="bg-slate-50 rounded-lg p-3 md:p-4 hover:bg-slate-100 transition-colors cursor-pointer border border-slate-200"
                >
                  <div className="flex items-start gap-3 md:gap-4">
                    <div className={`w-12 h-12 md:w-16 md:h-16 rounded-lg bg-gradient-to-br ${lesson.color} flex items-center justify-center flex-shrink-0`}>
                      <PlayCircle className="w-6 h-6 md:w-8 md:h-8 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-sm md:text-base text-slate-900 truncate">{lesson.title}</h4>
                      <p className="text-xs md:text-sm text-slate-600 mt-1">{lesson.subtitle}</p>
                      <div className="mt-2 md:mt-3">
                        <div className="flex items-center justify-between text-xs md:text-sm mb-1 md:mb-2">
                          <span className="text-slate-600">Progress</span>
                          <span className="font-medium text-sky-600">{lesson.progress}%</span>
                        </div>
                        <Progress value={lesson.progress} className="h-1.5 md:h-2 bg-slate-200" />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Progress Chart */}
          <Card className="p-4 md:p-6">
            <h3 className="font-bold text-base md:text-lg text-slate-900 mb-4">Weekly Progress</h3>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={progressData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="week" stroke="#64748b" tick={{ fontSize: 12 }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "white",
                    border: "1px solid #e2e8f0",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                />
                <Line type="monotone" dataKey="score" stroke="#0ea5e9" strokeWidth={3} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </div>

        {/* Right Column */}
        <div className="space-y-4 md:space-y-6">

          {/* Tasks Due */}
          <Card className="p-4 md:p-6">
            <h3 className="font-bold text-base md:text-lg text-slate-900 mb-4">Tasks Due</h3>
            <div className="space-y-2 md:space-y-3">
              {upcomingTasks.map((task) => (
                <div
                  key={task.id}
                  className="p-3 bg-slate-50 rounded-lg border border-slate-200 hover:border-sky-300 transition-colors"
                >
                  <div className="flex items-start gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs md:text-sm font-medium text-slate-900 leading-snug">{task.title}</p>
                      <div className="flex items-center gap-1 mt-1.5">
                        <Clock className="w-3 h-3 text-slate-400 flex-shrink-0" />
                        <span className="text-xs text-slate-500">{task.due}</span>
                      </div>
                    </div>
                    <Badge
                      className={`text-xs flex-shrink-0 ${
                        task.priority === "high"
                          ? "bg-red-100 text-red-700 hover:bg-red-100"
                          : task.priority === "medium"
                          ? "bg-amber-100 text-amber-700 hover:bg-amber-100"
                          : "bg-slate-100 text-slate-700 hover:bg-slate-100"
                      }`}
                    >
                      {task.priority === "high" && <AlertCircle className="w-3 h-3 mr-1" />}
                      {task.priority}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Mock Test Results */}
          <Card className="p-4 md:p-6">
            <h3 className="font-bold text-base md:text-lg text-slate-900 mb-4">Latest Mock Test</h3>
            <div className="space-y-3 md:space-y-4">
              {mockTestResults.map((result) => (
                <div key={result.section}>
                  <div className="flex items-center justify-between text-sm mb-1.5">
                    <span className="text-slate-700 font-medium text-xs md:text-sm">{result.section}</span>
                    <span className="font-bold text-sky-600 text-xs md:text-sm">
                      {result.score}/{result.total}
                    </span>
                  </div>
                  <Progress value={result.score} className="h-1.5 md:h-2 bg-slate-200" />
                </div>
              ))}
              <div className="mt-3 pt-3 border-t border-slate-200">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 text-sm md:text-base">Overall Score</span>
                  <span className="text-xl md:text-2xl font-bold text-sky-600">86.3%</span>
                </div>
              </div>
            </div>
          </Card>

          {/* Announcements */}
          <Card className="p-4 md:p-6">
            <h3 className="font-bold text-base md:text-lg text-slate-900 mb-4">Announcements</h3>
            <div className="space-y-3 md:space-y-4">
              {announcements.map((announcement) => (
                <div key={announcement.id} className="pb-3 border-b border-slate-200 last:border-0 last:pb-0">
                  <h4 className="font-medium text-slate-900 text-xs md:text-sm">{announcement.title}</h4>
                  <p className="text-xs text-slate-600 mt-1">{announcement.message}</p>
                  <p className="text-xs text-slate-400 mt-1.5">{announcement.date}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}