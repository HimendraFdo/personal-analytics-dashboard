"use client";

import { useUser } from "@clerk/nextjs";
import dynamic from "next/dynamic";
import ChartSkeleton from "@/components/dashboard/ChartSkeleton";
import SummaryCard from "@/components/dashboard/SummaryCard";
import { useMetricSelection } from "@/hooks/useMetricSelection";
import {
  getCategoryValueBreakdown,
  getMacroEnergyBreakdown,
  getWeekdayValueBreakdown,
} from "@/lib/analytics";
import { formatMacroValue, getMacroTotals } from "@/lib/nutrition";
import type { Entry } from "@/types/entry";
import { formatDisplayDate } from "@/utils/date";

type DashboardSectionProps = {
  entries: Entry[];
};

type DisplayBreakdownItem = {
  category: string;
  total: number;
  detail: string;
};

const ActivityTrendChart = dynamic(
  () => import("@/components/dashboard/ActivityTrendChart"),
  {
    ssr: false,
    loading: () => <ChartSkeleton label="Preparing trend" />,
  }
);

export default function DashboardSection({ entries }: DashboardSectionProps) {
  const { activeMetric, metricConfig } = useMetricSelection();
  const isCalories = activeMetric === "calories";
  const isMoney = activeMetric === "money";
  const { isLoaded, user } = useUser();
  const metadataDisplayName = user?.unsafeMetadata.displayName;
  const displayName =
    typeof metadataDisplayName === "string" && metadataDisplayName.trim()
      ? metadataDisplayName.trim()
      : user?.firstName || user?.username || "there";

  const totalEntries = entries.length;
  const totalValue = entries.reduce((total, entry) => total + entry.value, 0);
  const recentEntries = entries.slice(0, 4);
  const uniqueDates = new Set(entries.map((entry) => entry.date.toLocaleDateString()));
  const averageValuePerDay =
    uniqueDates.size > 0 ? totalValue / uniqueDates.size : 0;

  const categoryBreakdown = getCategoryValueBreakdown(entries);
  const weekdayBreakdown = getWeekdayValueBreakdown(entries);
  const macroEnergyBreakdown = getMacroEnergyBreakdown(entries);

  let topCategory = "N/A";
  let maxCategoryTotal = 0;
  for (const item of categoryBreakdown) {
    if (item.total > maxCategoryTotal) {
      maxCategoryTotal = item.total;
      topCategory = item.category;
    }
  }

  const today = new Date();
  const weekAgo = new Date();
  weekAgo.setDate(today.getDate() - 7);
  const entriesThisWeek = entries.filter((entry) => {
    const entryDate = new Date(entry.date);
    return entryDate >= weekAgo && entryDate <= today;
  });
  const weeklyEntryCount = entriesThisWeek.length;
  const valueThisWeek = entriesThisWeek.reduce(
    (total, entry) => total + entry.value,
    0
  );
  const macroTotals = getMacroTotals(entries);

  const dateTotals: Record<string, number> = {};
  for (const entry of entries) {
    const dateKey = entry.date.toISOString().split("T")[0];
    dateTotals[dateKey] = (dateTotals[dateKey] || 0) + entry.value;
  }

  const timeSeriesChartData = Object.entries(dateTotals)
    .map(([date, total]) => ({ date, total }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const chartTotal = timeSeriesChartData.reduce((sum, point) => sum + point.total, 0);
  const chartPeak = timeSeriesChartData.reduce(
    (best, point) => (point.total > best.total ? point : best),
    timeSeriesChartData[0] ?? { date: "", total: 0 }
  );

  const dashboardBreakdown = isMoney
    ? {
        title: "Spending by Weekday",
        description: "Total spend grouped by the day of week it happened.",
        emptyMessage: "Add money entries on different dates to see weekday spending.",
        data: weekdayBreakdown.map<DisplayBreakdownItem>((item) => ({
          category: item.category,
          total: item.total,
          detail: `${item.count} entries`,
        })),
        valueFormatter: metricConfig.formatValue,
      }
    : isCalories
      ? {
          title: "Macro Energy Breakdown",
          description: "Calories estimated from logged protein, carbs, and fat grams.",
          emptyMessage: "Log calorie entries with macro details to see macro energy.",
          data: macroEnergyBreakdown.map<DisplayBreakdownItem>((item) => ({
            category: item.category,
            total: item.total,
            detail: formatMacroValue(item.grams),
          })),
          valueFormatter: metricConfig.formatValue,
        }
      : {
          title: "Category Breakdown",
          description: `Total tracked ${metricConfig.label.toLowerCase()} grouped by category.`,
          emptyMessage: metricConfig.analyticsLabels.chartEmpty,
          data: categoryBreakdown.map<DisplayBreakdownItem>((item) => ({
            category: item.category,
            total: item.total,
            detail: `${item.count} entries`,
          })),
          valueFormatter: metricConfig.formatValue,
        };

  return (
    <div className="space-y-6 sm:space-y-8">
      <section className="relative overflow-hidden rounded-3xl border border-white/70 bg-[var(--metric-panel-strong)] text-white shadow-2xl shadow-[var(--metric-shadow)] transition-colors duration-500 sm:rounded-[2rem]">
        <div className="pointer-events-none absolute inset-0 opacity-70">
          <div className="absolute -right-16 -top-20 h-64 w-64 rounded-full bg-[var(--metric-primary)] blur-3xl" />
          <div className="absolute bottom-0 left-1/3 h-48 w-48 rounded-full bg-[var(--metric-secondary)] opacity-50 blur-3xl" />
        </div>
        <div className="grid gap-4 p-4 sm:gap-6 sm:p-6 lg:grid-cols-[1fr_420px] lg:p-8">
          <div className="relative">
            <p className="text-sm font-semibold text-[var(--metric-primary-soft)]">Overview</p>
            <h2 className="mt-2 text-2xl font-bold text-white sm:text-4xl">
              Welcome back{isLoaded ? `, ${displayName}` : ""}
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">
              Here is a snapshot of your recent {metricConfig.label.toLowerCase()} entries,
              key trends, and category totals across your personal dashboard.
            </p>
          </div>

          <div className="relative grid grid-cols-2 gap-2 sm:gap-3">
            {[
              ["Period", "This Month"],
              ["Entries", totalEntries.toString()],
              [metricConfig.analyticsLabels.topCategory, topCategory],
              ["7-Day Total", metricConfig.formatValue(valueThisWeek)],
            ].map(([label, value], index) => (
              <div
                key={label}
                className={`min-w-0 rounded-2xl border px-3 py-2.5 backdrop-blur sm:px-4 sm:py-3 ${
                  index === 3
                    ? "border-white/20 bg-[var(--metric-primary)]/20"
                    : "border-white/10 bg-white/10"
                }`}
              >
                <p className="text-xs font-semibold uppercase text-slate-400">{label}</p>
                <p className="mt-1 break-all text-xs font-semibold text-white sm:break-normal sm:text-sm">{value}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-4">
        <SummaryCard title={metricConfig.dashboardLabels.total} value={metricConfig.formatValue(totalValue)} accent="primary" detail="Tracked" />
        <SummaryCard title="This Week" value={metricConfig.formatValue(valueThisWeek)} accent="secondary" detail="7 days" />
        <SummaryCard title={metricConfig.analyticsLabels.topCategory} value={topCategory} accent="tertiary" detail="By value" />
        <SummaryCard title={metricConfig.dashboardLabels.averagePerDay} value={metricConfig.formatValue(averageValuePerDay)} accent="strong" detail="Daily" />
      </section>

      {isCalories && (
        <section className="grid gap-3 sm:grid-cols-3 sm:gap-4">
          <SummaryCard title="Protein" value={formatMacroValue(macroTotals.proteinGrams)} accent="primary" detail="Total" />
          <SummaryCard title="Carbs" value={formatMacroValue(macroTotals.carbsGrams)} accent="secondary" detail="Total" />
          <SummaryCard title="Fat" value={formatMacroValue(macroTotals.fatGrams)} accent="tertiary" detail="Total" />
        </section>
      )}

      <section className="grid gap-4 sm:gap-6 xl:grid-cols-12">
        <div className="rounded-3xl border border-white/80 bg-white/90 p-4 shadow-xl shadow-[var(--metric-shadow)] sm:rounded-[2rem] sm:p-6 xl:col-span-8">
          <div className="flex items-start justify-between gap-3 sm:gap-4">
            <div>
              <h3 className="text-xl font-semibold text-slate-900">
                {metricConfig.analyticsLabels.trendTitle}
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                Total tracked {metricConfig.label.toLowerCase()} by day across your entries.
              </p>
            </div>

            <div className="rounded-xl border border-[var(--metric-ring)] bg-[var(--metric-primary-soft)] px-3 py-2 text-sm font-semibold text-[var(--metric-primary)]">
              By day
            </div>
          </div>

          <div className="mt-4 h-64 sm:mt-6 sm:h-80">
            <ActivityTrendChart
              data={timeSeriesChartData}
              valueFormatter={metricConfig.formatValue}
              emptyMessage={metricConfig.analyticsLabels.chartEmpty}
              tooltipLabel={metricConfig.analyticsLabels.tooltipLabel}
            />
          </div>

          {timeSeriesChartData.length > 0 && (
            <p className="mt-4 text-sm text-slate-600">
              {metricConfig.formatValue(chartTotal)} total tracked {metricConfig.label.toLowerCase()}
              {chartPeak.date ? ` - peak on ${chartPeak.date} (${metricConfig.formatValue(chartPeak.total)})` : ""}
            </p>
          )}
        </div>

        <div className="space-y-4 sm:space-y-6 xl:col-span-4">
          <div className="rounded-3xl border border-white/80 bg-white/90 p-4 shadow-xl shadow-[var(--metric-shadow)] sm:rounded-[2rem] sm:p-6">
            <h3 className="text-lg font-semibold text-slate-900">Insights</h3>
            <p className="mt-1 text-sm text-slate-500">
              Quick highlights based on recent trends.
            </p>

            <div className="mt-4 space-y-3 sm:mt-5">
              {[
                `You currently have ${totalEntries} tracked entries.`,
                `Your top category by ${metricConfig.label.toLowerCase()} is ${topCategory}.`,
                `Your daily average is ${metricConfig.formatValue(averageValuePerDay)}.`,
              ].map((insight) => (
                <div
                  key={insight}
                  className="rounded-2xl border border-slate-200 bg-slate-50 p-3 transition hover:-translate-y-0.5 hover:border-[var(--metric-primary)] hover:bg-white sm:p-4"
                >
                  <p className="text-sm font-medium text-slate-900">{insight}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-white/80 bg-white/90 p-4 shadow-xl shadow-[var(--metric-shadow)] sm:rounded-[2rem] sm:p-6">
            <h3 className="text-lg font-semibold text-slate-900">Tracking Coverage</h3>
            <p className="mt-1 text-sm text-slate-500">
              Recent coverage for your {metricConfig.label.toLowerCase()} entries.
            </p>

            <div className="mt-4 space-y-4 sm:mt-5">
              <div>
                <div className="mb-2 flex justify-between text-sm">
                  <span className="text-slate-600">Entries This Week</span>
                  <span className="font-medium text-slate-900">{weeklyEntryCount}</span>
                </div>
                <div className="h-3 overflow-hidden rounded-full bg-slate-200">
                  <div
                    className="h-3 rounded-full bg-[var(--metric-primary)] transition-all duration-700"
                    style={{ width: `${Math.min((weeklyEntryCount / 7) * 100, 100)}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="mb-2 flex justify-between text-sm">
                  <span className="text-slate-600">Data Coverage</span>
                  <span className="font-medium text-slate-900">{uniqueDates.size} days</span>
                </div>
                <div className="h-3 overflow-hidden rounded-full bg-slate-200">
                  <div
                    className="h-3 rounded-full bg-[var(--metric-secondary)] transition-all duration-700"
                    style={{ width: `${Math.min(uniqueDates.size * 10, 100)}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-white/80 bg-white/90 p-4 shadow-xl shadow-[var(--metric-shadow)] sm:rounded-[2rem] sm:p-6">
          <h3 className="text-lg font-semibold text-slate-900">Recent Entries</h3>
          <p className="mt-1 text-sm text-slate-500">
            Your latest tracked items appear here.
          </p>

          <div className="mt-4 space-y-3 sm:mt-5">
            {recentEntries.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-500">
                {metricConfig.analyticsLabels.latestEmpty}
              </div>
            ) : (
              recentEntries.map((entry) => (
                <div
                  key={entry.id}
                  className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3 transition hover:-translate-y-0.5 hover:border-[var(--metric-primary)] hover:bg-white hover:shadow-md sm:flex-row sm:items-center sm:justify-between sm:p-4"
                >
                  <div className="min-w-0">
                    <span className="text-sm font-medium text-slate-900">
                      {entry.title}
                    </span>
                    <p className="mt-1 text-xs text-slate-500">
                      {entry.category} - {formatDisplayDate(entry.date)}
                    </p>
                  </div>

                  <div className="min-w-0 text-left sm:text-right">
                    <span className="text-sm font-semibold text-slate-700">
                      {metricConfig.formatValue(entry.value)}
                    </span>
                    {isCalories && (
                      <p className="mt-1 text-xs text-slate-500">
                        P {formatMacroValue(entry.proteinGrams ?? 0)} / C{" "}
                        {formatMacroValue(entry.carbsGrams ?? 0)} / F{" "}
                        {formatMacroValue(entry.fatGrams ?? 0)}
                      </p>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="rounded-3xl border border-white/80 bg-white/90 p-4 shadow-xl shadow-[var(--metric-shadow)] sm:rounded-[2rem] sm:p-6">
          <h3 className="text-lg font-semibold text-slate-900">{dashboardBreakdown.title}</h3>
          <p className="mt-1 text-sm text-slate-500">
            {dashboardBreakdown.description}
          </p>

          <div className="mt-4 space-y-3 sm:mt-6">
            {dashboardBreakdown.data.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-500">
                {dashboardBreakdown.emptyMessage}
              </div>
            ) : (
              dashboardBreakdown.data.map((item) => (
                <div
                  key={item.category}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3 transition hover:border-[var(--metric-secondary)] hover:bg-white sm:p-4"
                >
                  <div className="min-w-0">
                    <span className="text-sm font-medium text-slate-900">{item.category}</span>
                    <p className="mt-1 text-xs text-slate-500">{item.detail}</p>
                  </div>
                  <span className="max-w-full break-all rounded-full bg-white px-3 py-1 text-sm font-semibold text-slate-700 shadow-sm sm:break-normal">
                    {dashboardBreakdown.valueFormatter(item.total)}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
