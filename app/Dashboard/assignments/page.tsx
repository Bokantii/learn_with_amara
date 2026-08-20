import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ClipboardList,
  Clock,
  CheckCircle2,
  AlertCircle,
  Calendar,
} from "lucide-react";

type Priority = "high" | "medium" | "low";

interface PendingAssignment {
  id: number;
  title: string;
  program: string;
  dueDate: string;
  priority: Priority;
  points: number;
  type: string;
}

interface CompletedAssignment {
  id: number;
  title: string;
  program: string;
  submittedDate: string;
  score: number;
  totalPoints: number;
  feedback?: string;
}

const pendingAssignments: PendingAssignment[] = [
  {
    id: 1,
    title: "French Grammar Exercise - Les Temps",
    program: "TCF Preparation",
    dueDate: "Today, 6:00 PM",
    priority: "high",
    points: 50,
    type: "Exercise",
  },
  {
    id: 2,
    title: "TCF Mock Test - Reading",
    program: "TCF Preparation",
    dueDate: "Tomorrow, 4:00 PM",
    priority: "medium",
    points: 100,
    type: "Mock Test",
  },
  {
    id: 3,
    title: "Conversation Practice Assignment",
    program: "TEF Canada Preparation",
    dueDate: "Mar 15, 2026",
    priority: "low",
    points: 30,
    type: "Practice",
  },
  {
    id: 4,
    title: "TEF Vocabulary Quiz",
    program: "TEF Canada Preparation",
    dueDate: "Mar 16, 2026",
    priority: "medium",
    points: 40,
    type: "Quiz",
  },
];

const completedAssignments: CompletedAssignment[] = [
  {
    id: 5,
    title: "French Pronunciation Practice",
    program: "TCF Preparation",
    submittedDate: "Mar 11, 2026",
    score: 45,
    totalPoints: 50,
    feedback: "Excellent work! Keep practicing.",
  },
  {
    id: 6,
    title: "Reading Comprehension Exercise",
    program: "TCF Preparation",
    submittedDate: "Mar 9, 2026",
    score: 88,
    totalPoints: 100,
    feedback: "Great understanding of the text.",
  },
  {
    id: 7,
    title: "Grammar Quiz - Subjunctive",
    program: "TCF Preparation",
    submittedDate: "Mar 7, 2026",
    score: 35,
    totalPoints: 40,
    feedback: "Good job! Review the irregular verbs.",
  },
];

const getPriorityStyles = (priority: Priority) => {
  switch (priority) {
    case "high":
      return {
        badge: "bg-red-100 text-red-700 hover:bg-red-100",
        iconBox: "bg-red-100",
        icon: "text-red-600",
      };
    case "medium":
      return {
        badge: "bg-amber-100 text-amber-700 hover:bg-amber-100",
        iconBox: "bg-amber-100",
        icon: "text-amber-600",
      };
    case "low":
    default:
      return {
        badge: "bg-slate-100 text-slate-700 hover:bg-slate-100",
        iconBox: "bg-slate-100",
        icon: "text-slate-600",
      };
  }
};

export default function Assignments(): JSX.Element {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Assignments</h1>
        <p className="mt-2 text-slate-600">
          Complete your assignments and track your submissions
        </p>
      </div>

      <Tabs defaultValue="pending" className="w-full">
        <TabsList className="border border-slate-200 bg-white">
          <TabsTrigger value="pending">
            Pending
            <Badge className="ml-2 bg-sky-500 text-white hover:bg-sky-500">
              {pendingAssignments.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="mt-6">
          <div className="space-y-4">
            {pendingAssignments.map((assignment) => {
              const styles = getPriorityStyles(assignment.priority);

              return (
                <Card
                  key={assignment.id}
                  className="p-6 transition-shadow hover:shadow-lg"
                >
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div className="flex flex-1 items-start gap-4">
                      <div
                        className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg ${styles.iconBox}`}
                      >
                        <ClipboardList className={`h-6 w-6 ${styles.icon}`} />
                      </div>

                      <div className="flex-1">
                        <div className="mb-2 flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                          <h3 className="text-lg font-bold text-slate-900">
                            {assignment.title}
                          </h3>

                          <Badge className={styles.badge}>
                            {assignment.priority === "high" && (
                              <AlertCircle className="mr-1 h-3 w-3" />
                            )}
                            {assignment.priority}
                          </Badge>
                        </div>

                        <div className="mb-4 flex flex-wrap items-center gap-3 text-sm text-slate-600">
                          <Badge className="bg-sky-100 text-sky-700 hover:bg-sky-100">
                            {assignment.program}
                          </Badge>

                          <Badge className="bg-slate-100 text-slate-700 hover:bg-slate-100">
                            {assignment.type}
                          </Badge>

                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4 text-sky-500" />
                            <span>{assignment.dueDate}</span>
                          </div>

                          <span className="font-medium">
                            {assignment.points} points
                          </span>
                        </div>

                        <div className="flex flex-wrap gap-3">
                          <Button className="bg-gradient-to-r from-sky-500 to-cyan-500 text-white hover:from-sky-600 hover:to-cyan-600">
                            Start Assignment
                          </Button>

                          <Button
                            variant="outline"
                            className="border-slate-300"
                          >
                            View Details
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="completed" className="mt-6">
          <div className="space-y-4">
            {completedAssignments.map((assignment) => (
              <Card key={assignment.id} className="p-6">
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div className="flex flex-1 items-start gap-4">
                    <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-emerald-100">
                      <CheckCircle2 className="h-6 w-6 text-emerald-600" />
                    </div>

                    <div className="flex-1">
                      <div className="mb-2 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                        <h3 className="font-bold text-slate-900">
                          {assignment.title}
                        </h3>

                        <div className="flex items-center gap-2">
                          <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
                            Completed
                          </Badge>

                          <div className="text-right">
                            <div className="text-2xl font-bold text-emerald-600">
                              {assignment.score}/{assignment.totalPoints}
                            </div>
                            <div className="text-xs text-slate-500">
                              {Math.round(
                                (assignment.score / assignment.totalPoints) * 100
                              )}
                              %
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="mb-3 flex flex-wrap items-center gap-4 text-sm text-slate-600">
                        <Badge className="bg-sky-100 text-sky-700 hover:bg-sky-100">
                          {assignment.program}
                        </Badge>

                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          <span>Submitted: {assignment.submittedDate}</span>
                        </div>
                      </div>

                      {assignment.feedback && (
                        <div className="mb-3 rounded-lg border border-sky-200 bg-sky-50 p-3">
                          <p className="text-sm text-slate-700">
                            <span className="font-medium">Feedback: </span>
                            {assignment.feedback}
                          </p>
                        </div>
                      )}

                      <Button variant="outline" className="border-slate-300">
                        View Submission
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}