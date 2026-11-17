"use client";

import {
  CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, XAxis, YAxis,
} from "recharts";

export default function WeeklyProgressChart({ data }: { data: { week: string; score: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={data}>
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
  );
}
