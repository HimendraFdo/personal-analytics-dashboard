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

function formatDateTick(date: string): string {
  const [, month, day] = date.split("-");

  return month && day ? `${Number(month)}/${Number(day)}` : date;
}

export default function ActivityTrendChart({
  data,
  valueFormatter = (value) => String(value),
  emptyMessage = "Add entries to see your activity trend.",
  tooltipLabel = "Total",
}: ActivityTrendChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex h-full items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 text-sm text-slate-500">
        {emptyMessage}
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} margin={{ top: 10, right: 8, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="activityStroke" x1="0" x2="1" y1="0" y2="0">
            <stop offset="0%" stopColor="var(--metric-chart-start)" />
            <stop offset="55%" stopColor="var(--metric-chart-mid)" />
            <stop offset="100%" stopColor="var(--metric-chart-end)" />
          </linearGradient>
        </defs>
        <CartesianGrid stroke="#e2e8f0" strokeDasharray="4 6" vertical={false} />
        <XAxis
          dataKey="date"
          axisLine={false}
          tickLine={false}
          tickFormatter={formatDateTick}
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
          cursor={{ stroke: "var(--metric-primary-soft)", strokeWidth: 1 }}
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
          dot={{ r: 4, fill: "#ffffff", stroke: "var(--metric-primary)", strokeWidth: 2 }}
          activeDot={{ r: 7, fill: "var(--metric-primary)", stroke: "#ffffff", strokeWidth: 3 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
