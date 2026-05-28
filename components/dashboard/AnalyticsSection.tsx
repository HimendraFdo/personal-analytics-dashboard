"use client";

import dynamic from "next/dynamic";
import ChartSkeleton from "@/components/dashboard/ChartSkeleton";
import { useMetricSelection } from "@/hooks/useMetricSelection";
import { formatMacroValue, getMacroTotals } from "@/lib/nutrition";
import type { Entry } from "@/types/entry";
import { formatDisplayDate } from "@/utils/date";

type AnalyticsSectionProps = {
  entries: Entry[];
};

const ActivityTrendChart = dynamic(
  () => import("@/components/dashboard/ActivityTrendChart"),
  {
    ssr: false,
    loading: () => <ChartSkeleton label="Preparing trend" />,
  }
);

const CategoryTotalsChart = dynamic(
  () => import("@/components/dashboard/CategoryTotalsChart"),
  {
    ssr: false,
    loading: () => <ChartSkeleton label="Preparing totals" />,
  }
);

export default function AnalyticsSection({ entries }: AnalyticsSectionProps) {
  const { activeMetric, metricConfig } = useMetricSelection();
  const isCalories = activeMetric === "calories";
  const totalEntries = entries.length;
  const totalMetricValue = entries.reduce((total, entry) => total + entry.value, 0);
  const averageMetricValue = totalEntries > 0 ? totalMetricValue / totalEntries : 0.0;
  const macroTotals = getMacroTotals(entries);

  const categoryTotals: Record<string, number> = {};
  const categoryCounts: Record<string, number> = {};
  const dateTotals: Record<string, number> = {};

  for (const entry of entries) {
    categoryTotals[entry.category] = (categoryTotals[entry.category] || 0) + entry.value;
    categoryCounts[entry.category] = (categoryCounts[entry.category] || 0) + 1;
    const dateKey = entry.date.toISOString().split("T")[0];
    dateTotals[dateKey] = (dateTotals[dateKey] || 0) + entry.value;
  }

  let topMetricCategory = "N/A";
  let highestCategoryValue = 0;
  for (const category in categoryTotals) {
    if (categoryTotals[category] > highestCategoryValue) {
      highestCategoryValue = categoryTotals[category];
      topMetricCategory = category;
    }
  }

  const sortedEntries = [...entries].sort((a, b) => b.date.getTime() - a.date.getTime());
  const latestEntry = sortedEntries[0] ?? null;

  const categoryChartData = Object.entries(categoryTotals).map(([category, total]) => ({
    category,
    total,
  }));

  const timeSeriesChartData = Object.entries(dateTotals)
    .map(([date, total]) => ({ date, total }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border border-white/80 bg-white/90 p-6 shadow-xl shadow-slate-200/70">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="text-3xl font-bold text-slate-950">Analytics</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Review derived insights based on your tracked {metricConfig.label.toLowerCase()} entries.
            </p>
          </div>
          <div className="rounded-2xl border border-teal-100 bg-teal-50 px-4 py-3 text-sm font-semibold text-teal-700">
            {categoryChartData.length} active categories
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          ["Total Entries", totalEntries.toString(), "bg-teal-50 text-teal-700"],
          [
            metricConfig.analyticsLabels.total,
            metricConfig.formatValue(totalMetricValue),
            "bg-blue-50 text-blue-700",
          ],
          [
            metricConfig.analyticsLabels.averagePerEntry,
            metricConfig.formatValue(averageMetricValue),
            "bg-amber-50 text-amber-700",
          ],
          [metricConfig.analyticsLabels.topCategory, topMetricCategory, "bg-rose-50 text-rose-700"],
        ].map(([label, value, tone]) => (
          <div
            key={label}
            className="rounded-[2rem] border border-white/80 bg-white/90 p-5 shadow-lg shadow-slate-200/60 transition hover:-translate-y-1 hover:shadow-xl"
          >
            <p className="text-sm font-semibold text-slate-500">{label}</p>
            <div className="mt-5 flex items-end justify-between gap-3">
              <h3 className="text-3xl font-bold text-slate-950">{value}</h3>
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${tone}`}>
                Live
              </span>
            </div>
          </div>
        ))}
      </section>

      {isCalories && (
        <section className="grid gap-4 sm:grid-cols-3">
          {[
            ["Protein", formatMacroValue(macroTotals.proteinGrams), "bg-teal-50 text-teal-700"],
            ["Carbs", formatMacroValue(macroTotals.carbsGrams), "bg-blue-50 text-blue-700"],
            ["Fat", formatMacroValue(macroTotals.fatGrams), "bg-amber-50 text-amber-700"],
          ].map(([label, value, tone]) => (
            <div
              key={label}
              className="rounded-[2rem] border border-white/80 bg-white/90 p-5 shadow-lg shadow-slate-200/60"
            >
              <p className="text-sm font-semibold text-slate-500">{label}</p>
              <div className="mt-5 flex items-end justify-between gap-3">
                <h3 className="text-3xl font-bold text-slate-950">{value}</h3>
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${tone}`}>
                  Macro
                </span>
              </div>
            </div>
          ))}
        </section>
      )}

      <section className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-[2rem] border border-white/80 bg-white/90 p-6 shadow-xl shadow-slate-200/70">
          <h3 className="text-lg font-semibold text-slate-900">Category Totals</h3>
          <p className="mt-1 text-sm text-slate-500">
            {metricConfig.analyticsLabels.categoryTotalsDescription}
          </p>

          <div className="mt-5 space-y-3">
            {Object.keys(categoryTotals).length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-500">
                No analytics data yet.
              </div>
            ) : (
              Object.entries(categoryTotals).map(([category, total]) => (
                <div
                  key={category}
                  className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 p-4 transition hover:border-teal-200 hover:bg-white"
                >
                  <div>
                    <p className="text-sm font-medium text-slate-900">{category}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      {categoryCounts[category]} entries
                    </p>
                  </div>

                  <span className="rounded-full bg-white px-3 py-1 text-sm font-semibold text-slate-700 shadow-sm">
                    {metricConfig.formatValue(total)}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="rounded-[2rem] border border-white/80 bg-white/90 p-6 shadow-xl shadow-slate-200/70">
          <h3 className="text-lg font-semibold text-slate-900">Latest Recorded Entry</h3>
          <p className="mt-1 text-sm text-slate-500">
            Most recent item based on entry date.
          </p>

          <div className="mt-5">
            {latestEntry ? (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <p className="text-lg font-semibold text-slate-900">{latestEntry.title}</p>
                <p className="mt-2 text-sm text-slate-500">
                  {latestEntry.category} - {formatDisplayDate(latestEntry.date)}
                </p>
                <p className="mt-3 text-sm font-medium text-slate-700">
                  {metricConfig.inputLabel}: {metricConfig.formatValue(latestEntry.value)}
                </p>
                {isCalories && (
                  <div className="mt-3 grid gap-2 text-sm text-slate-600 sm:grid-cols-3">
                    <span>Protein {formatMacroValue(latestEntry.proteinGrams ?? 0)}</span>
                    <span>Carbs {formatMacroValue(latestEntry.carbsGrams ?? 0)}</span>
                    <span>Fat {formatMacroValue(latestEntry.fatGrams ?? 0)}</span>
                  </div>
                )}
                {latestEntry.note && (
                  <p className="mt-2 text-sm leading-6 text-slate-600">{latestEntry.note}</p>
                )}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-500">
                {metricConfig.analyticsLabels.latestEmpty}
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-[2rem] border border-white/80 bg-white/90 p-6 shadow-xl shadow-slate-200/70">
          <h3 className="text-lg font-semibold text-slate-900">Category Totals Chart</h3>
          <p className="mt-1 text-sm text-slate-500">
            Bar chart showing total tracked {metricConfig.label.toLowerCase()} by category.
          </p>

          <div className="mt-6 h-72">
            <CategoryTotalsChart
              data={categoryChartData}
              valueFormatter={metricConfig.formatValue}
              emptyMessage={metricConfig.analyticsLabels.chartEmpty}
              tooltipLabel={metricConfig.analyticsLabels.tooltipLabel}
            />
          </div>
        </div>

        <div className="rounded-[2rem] border border-white/80 bg-white/90 p-6 shadow-xl shadow-slate-200/70">
          <h3 className="text-lg font-semibold text-slate-900">
            {metricConfig.analyticsLabels.trendTitle}
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            {metricConfig.analyticsLabels.trendDescription}
          </p>

          <div className="mt-6 h-72">
            <ActivityTrendChart
              data={timeSeriesChartData}
              valueFormatter={metricConfig.formatValue}
              emptyMessage={metricConfig.analyticsLabels.chartEmpty}
              tooltipLabel={metricConfig.analyticsLabels.tooltipLabel}
            />
          </div>
        </div>
      </section>
    </div>
  );
}
