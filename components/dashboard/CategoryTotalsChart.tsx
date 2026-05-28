"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type CategoryTotalsChartProps = {
  data: Array<{
    category: string;
    total: number;
  }>;
};

export default function CategoryTotalsChart({ data }: CategoryTotalsChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex h-full items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 text-sm text-slate-500">
        No chart data yet.
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 10, right: 16, left: -10, bottom: 0 }}>
        <CartesianGrid stroke="#e2e8f0" strokeDasharray="4 6" vertical={false} />
        <XAxis
          dataKey="category"
          axisLine={false}
          tickLine={false}
          tick={{ fill: "#64748b", fontSize: 12 }}
        />
        <YAxis axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 12 }} />
        <Tooltip
          cursor={{ fill: "rgba(15, 118, 110, 0.08)" }}
          contentStyle={{
            border: "1px solid #e2e8f0",
            borderRadius: 16,
            boxShadow: "0 18px 45px rgba(15, 23, 42, 0.12)",
          }}
        />
        <Bar dataKey="total" fill="#0f766e" radius={[10, 10, 4, 4]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
