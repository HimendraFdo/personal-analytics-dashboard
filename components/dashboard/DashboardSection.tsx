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
import SummaryCard from "@/components/dashboard/SummaryCard";
import type { Entry } from "@/types/entry";
import { formatDisplayDate } from "@/utils/date";

type DashboardSectionProps = {
  entries: Entry[];
};

export default function DashboardSection({
  entries,
}: DashboardSectionProps) {

  const totalEntries = entries.length;

  const recentEntries = entries.slice(0, 4);

  const uniqueDates = new Set(entries.map((entry) => entry.date.toLocaleDateString()));

  const averagePerDay = uniqueDates.size > 0 ? (totalEntries / uniqueDates.size).toFixed(1) : "0.0";

  const categoryCounts: Record<string, number> = {};

  // Calculate the count of entries for each category
  for (const entry of entries) {
    categoryCounts[entry.category] = (categoryCounts[entry.category] || 0) + 1;
  }

  let topCategory = "N/A";
  let maxCount = 0;

  // Determine the category with the highest count
  for(const category in categoryCounts) {
    if(categoryCounts[category] > maxCount) {
      maxCount = categoryCounts[category];
      topCategory = category;
    }
  }

  // Calculate entries in the last 7 days
  const today = new Date();
  const weekAgo = new Date();
  weekAgo.setDate(today.getDate() - 7);

  // Filter entries that fall within the last 7 days
  const entriesThisWeek = entries.filter((entry) => {
    const entryDate = new Date(entry.date);
    return entryDate >= weekAgo && entryDate <= today;
  }).length;

  const dateTotals: Record<string, number> = {};
  for (const entry of entries) {
    const dateKey = entry.date.toISOString().split("T")[0];
    dateTotals[dateKey] = (dateTotals[dateKey] || 0) + entry.value;
  }

  const timeSeriesChartData = Object.entries(dateTotals)
    .map(([date, total]) => ({
      date,
      total,
    }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const chartTotal = timeSeriesChartData.reduce((sum, point) => sum + point.total, 0);
  const chartPeak = timeSeriesChartData.reduce(
    (best, point) => (point.total > best.total ? point : best),
    timeSeriesChartData[0] ?? { date: "", total: 0 }
  );

  return (
    <div className="space-y-8">
      {/* Dashboard Overview */}
      <section className="rounded-3xl bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500">Overview</p>
            <h2 className="mt-2 text-3xl font-bold text-slate-900">
              Welcome back, Himendra
            </h2>
            <p className="mt-2 max-w-2xl text-sm text-slate-600">
              Here is a snapshot of your recent activity, key trends, and the
              metrics you are tracking across your personal dashboard.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-2xl bg-slate-100 px-4 py-3">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Period
              </p>
              <p className="mt-1 text-sm font-semibold text-slate-900">
                This Month
              </p>
            </div>

            <div className="rounded-2xl bg-slate-100 px-4 py-3">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Entries
              </p>
              <p className="mt-1 text-sm font-semibold text-slate-900">
                {totalEntries}
              </p>
            </div>

            <div className="rounded-2xl bg-slate-100 px-4 py-3">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Focus
              </p>
              <p className="mt-1 text-sm font-semibold text-slate-900">
                {topCategory}
              </p>
            </div>

            <div className="rounded-2xl bg-slate-100 px-4 py-3">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Goal
              </p>
              <p className="mt-1 text-sm font-semibold text-slate-900">
                On Track
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Summary Cards */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard title="Total Entries" value={totalEntries.toString()} />
        <SummaryCard title="This Week" value={entriesThisWeek.toString()} />
        <SummaryCard title="Top Category" value={topCategory} />
        <SummaryCard title="Average per Day" value={averagePerDay} />
      </section>

      {/* Main Analytics Chart */}
      <section className="grid gap-6 xl:grid-cols-12">
        <div className="rounded-3xl bg-white p-6 shadow-sm xl:col-span-8">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-xl font-semibold text-slate-900">
                Activity Trend
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                Total tracked value by day across your entries.
              </p>
            </div>

            <div className="rounded-xl bg-slate-100 px-3 py-2 text-sm text-slate-600">
              By day
            </div>
          </div>

          <div className="mt-6 h-80">
            {timeSeriesChartData.length === 0 ? (
              <div className="flex h-full items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 text-sm text-slate-500">
                Add entries to see your activity trend.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={timeSeriesChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="total"
                    stroke="#0f172a"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>

          {timeSeriesChartData.length > 0 && (
            <p className="mt-4 text-sm text-slate-600">
              {chartTotal.toFixed(1)} total value tracked
              {chartPeak.date
                ? ` · peak on ${chartPeak.date} (${chartPeak.total})`
                : ""}
            </p>
          )}
        </div>

        {/* Insights List */}
        <div className="space-y-6 xl:col-span-4">
          <div className="rounded-3xl bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-900">Insights</h3>
            <p className="mt-1 text-sm text-slate-500">
              Quick highlights based on recent trends.
            </p>

            <div className="mt-5 space-y-3">
              <div className="rounded-2xl bg-slate-100 p-4">
                <p className="text-sm font-medium text-slate-900">
                  You currently have {totalEntries} tracked entries.
                </p>
              </div>

              <div className="rounded-2xl bg-slate-100 p-4">
                <p className="text-sm font-medium text-slate-900">
                  Your most common category is {topCategory}.
                </p>
              </div>

              <div className="rounded-2xl bg-slate-100 p-4">
                <p className="text-sm font-medium text-slate-900">
                  Your average activity is {averagePerDay} entries per day.
                </p>
              </div>
            </div>
          </div>

          {/* Progress Overview with Progress Bars */}
          <div className="rounded-3xl bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-900">Progress</h3>
            <p className="mt-1 text-sm text-slate-500">
              Keep this area for goals or performance summaries.
            </p>

            <div className="mt-5 space-y-4">
              <div>
                <div className="mb-2 flex justify-between text-sm">
                  <span className="text-slate-600">Weekly Goal</span>
                  <span className="font-medium text-slate-900">
                    {entriesThisWeek}/7
                    </span>
                </div>
                <div className="h-3 rounded-full bg-slate-200">
                  <div
                    className="h-3 rounded-full bg-slate-900"
                    style={{ width: `${Math.min((entriesThisWeek / 7) * 100, 100)}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="mb-2 flex justify-between text-sm">
                  <span className="text-slate-600">Data Coverage</span>
                  <span className="font-medium text-slate-900">
                    {uniqueDates.size} days
                  </span>
                </div>
                <div className="h-3 rounded-full bg-slate-200">
                  <div
                    className="h-3 rounded-full bg-slate-700"
                    style={{ width: `${Math.min(uniqueDates.size * 10, 100)}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* List of Recent Entries */}
      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900">Recent Entries</h3>
          <p className="mt-1 text-sm text-slate-500">
            Your latest tracked items appear here.
          </p>

          <div className="mt-5 space-y-3">
            {recentEntries.length === 0 ? (
              <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-500">
                No recent entries yet.
              </div>
            ) : (
              recentEntries.map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-center justify-between rounded-2xl bg-slate-100 p-4"
                >
                  <div>
                    <span className="text-sm font-medium text-slate-900">
                      {entry.title}
                    </span>
                    <p className="mt-1 text-xs text-slate-500">
                      {entry.category} • {formatDisplayDate(entry.date)}
                    </p>
                  </div>

                  <span className="text-sm text-slate-600">{entry.value}</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Summary of Categories */}
        <div className="rounded-3xl bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900">
            Category Breakdown
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            A smaller secondary visualization can live here.
          </p>

          <div className="mt-6 space-y-3">
            {Object.keys(categoryCounts).length === 0 ? (
              <div className="rounded-2xl bg-slate-100 p-4 text-sm text-slate-500">
                No category data yet.
              </div>
            ) : (
              Object.entries(categoryCounts).map(([category, count]) => (
                <div
                  key={category}
                  className="flex items-center justify-between rounded-2xl bg-slate-100 p-4"
                >
                  <span className="text-sm font-medium text-slate-900">
                    {category}
                  </span>
                  <span className="text-sm text-slate-600">{count}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
