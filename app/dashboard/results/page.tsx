"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis,
  PolarRadiusAxis, Radar, Legend,
} from "recharts";
import { Trophy, TrendingUp, Award, Download, Eye } from "lucide-react";

const mockTests = [
  {
    id: 1,
    name: "TCF Mock Test - Full Exam",
    date: "Mar 10, 2026",
    overallScore: 86.3,
    sections: [
      { name: "Reading", score: 88, total: 100 },
      { name: "Writing", score: 82, total: 100 },
      { name: "Listening", score: 90, total: 100 },
      { name: "Speaking", score: 85, total: 100 },
    ],
  },
  {
    id: 2,
    name: "TEF Canada Practice Test",
    date: "Mar 5, 2026",
    overallScore: 78.5,
    sections: [
      { name: "Reading", score: 75, total: 100 },
      { name: "Writing", score: 80, total: 100 },
      { name: "Listening", score: 82, total: 100 },
      { name: "Speaking", score: 77, total: 100 },
    ],
  },
];

const progressData = [
  { test: "Test 1", score: 65 },
  { test: "Test 2", score: 72 },
  { test: "Test 3", score: 78 },
  { test: "Test 4", score: 78.5 },
  { test: "Test 5", score: 86.3 },
];

const skillsData = [
  { skill: "Reading", current: 88, target: 90 },
  { skill: "Writing", current: 82, target: 85 },
  { skill: "Listening", current: 90, target: 90 },
  { skill: "Speaking", current: 85, target: 88 },
];

export default function Results() {
  return (
    <div className="space-y-4 md:space-y-6 px-2 sm:px-0">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Results</h1>
        <p className="text-slate-600 mt-2 text-sm sm:text-base">
          Track your performance and progress over time
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-6">
        <Card className="p-4 md:p-6 bg-gradient-to-br from-sky-400 to-sky-500 text-white border-0">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sky-100 text-xs md:text-sm">Latest Test Score</p>
              <p className="text-2xl md:text-3xl font-bold mt-1 md:mt-2">86.3%</p>
              <div className="flex items-center gap-1 mt-1 md:mt-2">
                <TrendingUp className="w-3.5 h-3.5 md:w-4 md:h-4" />
                <span className="text-xs md:text-sm">+7.8% from last test</span>
              </div>
            </div>
            <div className="w-10 h-10 md:w-12 md:h-12 bg-white/20 rounded-lg flex items-center justify-center">
              <Trophy className="w-5 h-5 md:w-6 md:h-6" />
            </div>
          </div>
        </Card>

        <Card className="p-4 md:p-6 bg-gradient-to-br from-emerald-400 to-emerald-500 text-white border-0">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-emerald-100 text-xs md:text-sm">Tests Completed</p>
              <p className="text-2xl md:text-3xl font-bold mt-1 md:mt-2">4/12</p>
              <div className="flex items-center gap-1 mt-1 md:mt-2">
                <Award className="w-3.5 h-3.5 md:w-4 md:h-4" />
                <span className="text-xs md:text-sm">4 this month</span>
              </div>
            </div>
            <div className="w-10 h-10 md:w-12 md:h-12 bg-white/20 rounded-lg flex items-center justify-center">
              <Award className="w-5 h-5 md:w-6 md:h-6" />
            </div>
          </div>
        </Card>

        <Card className="p-4 md:p-6 bg-gradient-to-br from-cyan-400 to-cyan-500 text-white border-0">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-cyan-100 text-xs md:text-sm">Average Score</p>
              <p className="text-2xl md:text-3xl font-bold mt-1 md:mt-2">79.8%</p>
              <div className="flex items-center gap-1 mt-1 md:mt-2">
                <TrendingUp className="w-3.5 h-3.5 md:w-4 md:h-4" />
                <span className="text-xs md:text-sm">Improving steadily</span>
              </div>
            </div>
            <div className="w-10 h-10 md:w-12 md:h-12 bg-white/20 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 md:w-6 md:h-6" />
            </div>
          </div>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        <Card className="p-4 md:p-6">
          <h3 className="font-bold text-base md:text-lg text-slate-900 mb-4">Progress Over Time</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={progressData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="test" stroke="#64748b" tick={{ fontSize: 12 }} />
              <YAxis stroke="#64748b" domain={[0, 100]} tick={{ fontSize: 12 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "white",
                  border: "1px solid #e2e8f0",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
              />
              <Bar dataKey="score" fill="#0ea5e9" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-4 md:p-6">
          <h3 className="font-bold text-base md:text-lg text-slate-900 mb-4">Skills Analysis</h3>
          <ResponsiveContainer width="100%" height={250}>
            <RadarChart data={skillsData}>
              <PolarGrid stroke="#e2e8f0" />
              <PolarAngleAxis dataKey="skill" stroke="#64748b" tick={{ fontSize: 12 }} />
              <PolarRadiusAxis domain={[0, 100]} stroke="#64748b" tick={{ fontSize: 10 }} />
              <Radar name="Current" dataKey="current" stroke="#0ea5e9" fill="#0ea5e9" fillOpacity={0.6} />
              <Radar name="Target" dataKey="target" stroke="#06b6d4" fill="#06b6d4" fillOpacity={0.3} />
              <Legend wrapperStyle={{ fontSize: "12px" }} />
            </RadarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Mock Test Results */}
      <Card className="p-4 md:p-6">
        <h3 className="font-bold text-base md:text-lg text-slate-900 mb-4">Mock Test Results</h3>
        <div className="space-y-4 md:space-y-6">
          {mockTests.map((test) => (
            <div key={test.id} className="border border-slate-200 rounded-lg p-4 md:p-6">
              {/* Test Header */}
              <div className="flex items-start justify-between mb-4 gap-3">
                <div className="min-w-0">
                  <h4 className="font-bold text-sm md:text-base text-slate-900 leading-snug">
                    {test.name}
                  </h4>
                  <p className="text-xs md:text-sm text-slate-600 mt-1">{test.date}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-2xl md:text-3xl font-bold text-sky-600">
                    {test.overallScore}%
                  </div>
                  <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 mt-1 text-xs">
                    Passed
                  </Badge>
                </div>
              </div>

              {/* Section Scores */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-4">
                {test.sections.map((section) => (
                  <div key={section.name}>
                    <div className="flex items-center justify-between text-xs md:text-sm mb-1.5">
                      <span className="text-slate-700 font-medium">{section.name}</span>
                      <span className="font-bold text-sky-600">
                        {section.score}/{section.total}
                      </span>
                    </div>
                    <Progress value={section.score} className="h-1.5 md:h-2 bg-slate-200" />
                  </div>
                ))}
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                <Button
                  variant="outline"
                  className="border-sky-300 text-sky-600 hover:bg-sky-50 text-xs md:text-sm h-8 md:h-9"
                >
                  <Eye className="w-3.5 h-3.5 md:w-4 md:h-4 mr-2" />
                  View Details
                </Button>
                <Button
                  variant="outline"
                  className="border-slate-300 text-xs md:text-sm h-8 md:h-9"
                >
                  <Download className="w-3.5 h-3.5 md:w-4 md:h-4 mr-2" />
                  Download Report
                </Button>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}