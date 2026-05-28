"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type ActivityTrendChartProps = {
  data: Array<{
    date: string;
    total: number;
  }>;
  valueFormatter?: (value: number) => string;
};

export default function ActivityTrendChart({
  data,
  valueFormatter = (value) => String(value),
}: ActivityTrendChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex h-full items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 text-sm text-slate-500">
        Add entries to see your activity trend.
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} margin={{ top: 10, right: 18, left: -10, bottom: 0 }}>
        <defs>
          <linearGradient id="activityStroke" x1="0" x2="1" y1="0" y2="0">
            <stop offset="0%" stopColor="#0f766e" />
            <stop offset="55%" stopColor="#2563eb" />
            <stop offset="100%" stopColor="#f59e0b" />
          </linearGradient>
        </defs>
        <CartesianGrid stroke="#e2e8f0" strokeDasharray="4 6" vertical={false} />
        <XAxis
          dataKey="date"
          axisLine={false}
          tickLine={false}
          tick={{ fill: "#64748b", fontSize: 12 }}
        />
        <YAxis axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 12 }} />
        <Tooltip
          formatter={(value) => [
            valueFormatter(Number(value)),
            "Total",
          ]}
          cursor={{ stroke: "#cbd5e1", strokeWidth: 1 }}
          contentStyle={{
            border: "1px solid #e2e8f0",
            borderRadius: 16,
            boxShadow: "0 18px 45px rgba(15, 23, 42, 0.12)",
          }}
        />
        <Line
          type="monotone"
          dataKey="total"
          stroke="url(#activityStroke)"
          strokeWidth={4}
          dot={{ r: 4, fill: "#ffffff", stroke: "#0f766e", strokeWidth: 2 }}
          activeDot={{ r: 7, fill: "#0f766e", stroke: "#ffffff", strokeWidth: 3 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
