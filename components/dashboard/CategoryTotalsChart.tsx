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
  valueFormatter?: (value: number) => string;
  emptyMessage?: string;
  tooltipLabel?: string;
};

function formatAxisValue(value: number): string {
  const absoluteValue = Math.abs(value);

  if (absoluteValue >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1).replace(/\.0$/, "")}m`;
  }

  if (absoluteValue >= 1_000) {
    return `${(value / 1_000).toFixed(1).replace(/\.0$/, "")}k`;
  }

  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

function formatCategoryTick(category: string): string {
  return category.length > 10 ? `${category.slice(0, 9)}...` : category;
}

export default function CategoryTotalsChart({
  data,
  valueFormatter = (value) => String(value),
  emptyMessage = "No chart data yet.",
  tooltipLabel = "Total",
}: CategoryTotalsChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex h-full items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 text-sm text-slate-500">
        {emptyMessage}
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 10, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid stroke="#e2e8f0" strokeDasharray="4 6" vertical={false} />
        <XAxis
          dataKey="category"
          axisLine={false}
          tickLine={false}
          tickFormatter={formatCategoryTick}
          tick={{ fill: "#64748b", fontSize: 12 }}
          tickMargin={8}
        />
        <YAxis
          axisLine={false}
          tickLine={false}
          tick={{ fill: "#64748b", fontSize: 12 }}
          tickFormatter={(value) => formatAxisValue(Number(value))}
          width={44}
        />
        <Tooltip
          formatter={(value) => [
            valueFormatter(Number(value)),
            tooltipLabel,
          ]}
          cursor={{ fill: "var(--metric-primary-soft)" }}
          contentStyle={{
            border: "1px solid #e2e8f0",
            borderRadius: 16,
            boxShadow: "0 18px 45px rgba(15, 23, 42, 0.12)",
          }}
        />
        <Bar dataKey="total" fill="var(--metric-primary)" radius={[10, 10, 4, 4]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
