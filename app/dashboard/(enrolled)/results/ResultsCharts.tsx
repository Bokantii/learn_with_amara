"use client";

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
} from "recharts";
import { Card } from "@/components/ui/card";
import { SKILL_MIN_AXES } from "@/lib/results/analytics";

const SKILL_LABEL: Record<string, string> = {
  GRAMMAR: "Grammar",
  VOCABULARY: "Vocabulary",
  READING: "Reading",
  LISTENING: "Listening",
  WRITING: "Writing",
  SPEAKING: "Speaking",
};

const tooltipStyle = {
  backgroundColor: "white",
  border: "1px solid #e2e8f0",
  borderRadius: "8px",
  fontSize: "12px",
} as const;

/**
 * Client-only charts for the Results page. The server decides whether there is
 * enough real data to pass in — this component never invents points: it renders
 * only the series it is given.
 */
export default function ResultsCharts({
  trend,
  skills,
}: {
  trend: { label: string; percent: number }[] | null;
  skills: { skill: string; percentage: number }[];
}) {
  const showSkills = skills.length >= SKILL_MIN_AXES;
  if (!trend && !showSkills) return null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
      {trend && (
        <Card className="p-4 md:p-6">
          <h2 className="font-bold text-base md:text-lg text-slate-900 mb-4">
            Assignment score trend
          </h2>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={trend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="label" stroke="#64748b" tick={{ fontSize: 12 }} />
              <YAxis stroke="#64748b" domain={[0, 100]} tick={{ fontSize: 12 }} unit="%" />
              <Tooltip contentStyle={tooltipStyle} formatter={(v) => [`${v}%`, "Score"]} />
              <Bar dataKey="percent" fill="#0ea5e9" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      )}

      {showSkills && (
        <Card className="p-4 md:p-6">
          <h2 className="font-bold text-base md:text-lg text-slate-900 mb-4">Skills analysis</h2>
          <p className="text-xs text-slate-500 mb-2">
            Share of auto-graded questions answered correctly, by skill, across your completed
            assessments.
          </p>
          <ResponsiveContainer width="100%" height={250}>
            <RadarChart data={skills.map((s) => ({ ...s, skill: SKILL_LABEL[s.skill] ?? s.skill }))}>
              <PolarGrid stroke="#e2e8f0" />
              <PolarAngleAxis dataKey="skill" stroke="#64748b" tick={{ fontSize: 12 }} />
              <PolarRadiusAxis domain={[0, 100]} stroke="#64748b" tick={{ fontSize: 10 }} />
              <Radar
                name="Correct"
                dataKey="percentage"
                stroke="#0ea5e9"
                fill="#0ea5e9"
                fillOpacity={0.6}
              />
              <Tooltip contentStyle={tooltipStyle} formatter={(v) => [`${v}%`, "Correct"]} />
            </RadarChart>
          </ResponsiveContainer>
        </Card>
      )}
    </div>
  );
}
