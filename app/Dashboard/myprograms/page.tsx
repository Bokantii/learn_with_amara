import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { BookOpen, Award, ChevronRight } from "lucide-react";

const programs = [
  {
    id: 1,
    name: "TCF Exam Preparation",
    language: "French",
    level: "B2",
    progress: 78,
    lessonsCompleted: 24,
    totalLessons: 32,
    examDate: "Apr 15, 2026",
    status: "active",
  },
  {
    id: 2,
    name: "TEF Canada Preparation",
    language: "French",
    level: "B1-B2",
    progress: 45,
    lessonsCompleted: 14,
    totalLessons: 28,
    examDate: "May 20, 2026",
    status: "active",
  },
  {
    id: 3,
    name: "Business Spanish",
    language: "Spanish",
    level: "A2",
    progress: 30,
    lessonsCompleted: 9,
    totalLessons: 30,
    examDate: "Not scheduled",
    status: "active",
  },
  {
    id: 4,
    name: "HSK 3 Preparation",
    language: "Chinese",
    level: "HSK 3",
    progress: 15,
    lessonsCompleted: 5,
    totalLessons: 35,
    examDate: "Jun 10, 2026",
    status: "paused",
  },
];

export default function MyPrograms() {
  return (
    <div className="space-y-6 px-2 sm:px-0">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">My Programs</h1>
        <p className="text-slate-600 mt-2 text-sm sm:text-base">
          Track your learning progress across all enrolled programs
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {programs.map((program) => (
          <Card key={program.id} className="p-4 md:p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-start gap-3 md:gap-4">
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg bg-gradient-to-br from-sky-400 to-cyan-500 flex items-center justify-center flex-shrink-0">
                  <BookOpen className="w-5 h-5 md:w-6 md:h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-base md:text-lg text-slate-900 leading-snug">
                    {program.name}
                  </h3>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <Badge className="bg-sky-100 text-sky-700 hover:bg-sky-100 text-xs">
                      {program.language}
                    </Badge>
                    <Badge className="bg-slate-100 text-slate-700 hover:bg-slate-100 text-xs">
                      {program.level}
                    </Badge>
                  </div>
                </div>
              </div>
              <Badge
                className={`text-xs flex-shrink-0 ${
                  program.status === "active"
                    ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-100"
                    : "bg-amber-100 text-amber-700 hover:bg-amber-100"
                }`}
              >
                {program.status}
              </Badge>
            </div>

            <div className="space-y-3 md:space-y-4 mb-4 md:mb-6">
              <div>
                <div className="flex items-center justify-between text-xs md:text-sm mb-1.5 md:mb-2">
                  <span className="text-slate-600">Overall Progress</span>
                  <span className="font-bold text-sky-600">{program.progress}%</span>
                </div>
                <Progress value={program.progress} className="h-1.5 md:h-2 bg-slate-200" />
              </div>

              <div className="flex items-center justify-between text-xs md:text-sm flex-wrap gap-2">
                <div className="flex items-center gap-1.5 text-slate-600">
                  <BookOpen className="w-3.5 h-3.5 md:w-4 md:h-4 text-sky-500" />
                  <span>{program.lessonsCompleted}/{program.totalLessons} Lessons</span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-600">
                  <Award className="w-3.5 h-3.5 md:w-4 md:h-4 text-amber-500" />
                  <span>{program.examDate}</span>
                </div>
              </div>
            </div>

            <Button className="w-full bg-gradient-to-r from-sky-500 to-cyan-500 hover:from-sky-600 hover:to-cyan-600 text-white text-sm h-9 md:h-10">
              Continue Learning
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </Card>
        ))}
      </div>
    </div>
  );
}