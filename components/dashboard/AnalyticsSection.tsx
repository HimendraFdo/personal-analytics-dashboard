"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import ChartSkeleton from "@/components/dashboard/ChartSkeleton";
import { useMetricSelection } from "@/hooks/useMetricSelection";
import {
  filterEntriesByTimeRange,
  getCategoryValueBreakdown,
  getMacroEnergyBreakdown,
  getWeekdayValueBreakdown,
  TIME_RANGE_OPTIONS,
  type TimeRangeFilter,
} from "@/lib/analytics";
import { formatMacroValue, getMacroTotals } from "@/lib/nutrition";
import type { Entry } from "@/types/entry";
import { formatDisplayDate } from "@/utils/date";

type AnalyticsSectionProps = {
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

const CategoryTotalsChart = dynamic(
  () => import("@/components/dashboard/CategoryTotalsChart"),
  {
    ssr: false,
    loading: () => <ChartSkeleton label="Preparing totals" />,
  }
);

export default function AnalyticsSection({ entries }: AnalyticsSectionProps) {
  const { activeMetric, metricConfig } = useMetricSelection();
  const [selectedRange, setSelectedRange] = useState<TimeRangeFilter>("all");
  const isCalories = activeMetric === "calories";
  const isMoney = activeMetric === "money";

  const rangeFilteredEntries = useMemo(
    () => filterEntriesByTimeRange(entries, selectedRange),
    [entries, selectedRange]
  );

  const totalEntries = rangeFilteredEntries.length;
  const totalMetricValue = rangeFilteredEntries.reduce((total, entry) => total + entry.value, 0);
  const averageMetricValue = totalEntries > 0 ? totalMetricValue / totalEntries : 0.0;
  const macroTotals = getMacroTotals(rangeFilteredEntries);

  const dateTotals: Record<string, number> = {};
  const categoryBreakdown = getCategoryValueBreakdown(rangeFilteredEntries);
  const weekdayBreakdown = getWeekdayValueBreakdown(rangeFilteredEntries);
  const macroEnergyBreakdown = getMacroEnergyBreakdown(rangeFilteredEntries);

  for (const entry of rangeFilteredEntries) {
    const dateKey = entry.date.toISOString().split("T")[0];
    dateTotals[dateKey] = (dateTotals[dateKey] || 0) + entry.value;
  }

  let topMetricCategory = "N/A";
  let highestCategoryValue = 0;
  for (const item of categoryBreakdown) {
    if (item.total > highestCategoryValue) {
      highestCategoryValue = item.total;
      topMetricCategory = item.category;
    }
  }

  const sortedEntries = [...rangeFilteredEntries].sort(
    (a, b) => b.date.getTime() - a.date.getTime()
  );
  const latestEntry = sortedEntries[0] ?? null;

  const timeSeriesChartData = Object.entries(dateTotals)
    .map(([date, total]) => ({ date, total }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const analyticsBreakdown = isMoney
    ? {
        title: "Spending by Weekday",
        chartTitle: "Weekday Spending Chart",
        description:
          "Total spend grouped by the day of week it happened, so you can spot spending patterns.",
        chartDescription:
          "Bar chart showing which weekdays carry the most spending.",
        emptyMessage: "Add money entries on different dates to see weekday spending.",
        data: weekdayBreakdown.map<DisplayBreakdownItem>((item) => ({
          category: item.category,
          total: item.total,
          detail: `${item.count} entries - avg ${metricConfig.formatValue(item.total / item.count)}`,
        })),
        valueFormatter: metricConfig.formatValue,
        tooltipLabel: "Total Spent",
      }
    : isCalories
      ? {
          title: "Macro Energy Breakdown",
          chartTitle: "Macro Energy Chart",
          description:
            "Calories estimated from logged protein, carbs, and fat grams.",
          chartDescription:
            "Bar chart showing estimated calories contributed by each macro.",
          emptyMessage: "Log calorie entries with macro details to see macro energy.",
          data: macroEnergyBreakdown.map<DisplayBreakdownItem>((item) => ({
            category: item.category,
            total: item.total,
            detail: `${formatMacroValue(item.grams)} logged`,
          })),
          valueFormatter: metricConfig.formatValue,
          tooltipLabel: "Estimated Calories",
        }
      : {
          title: "Category Totals",
          chartTitle: "Category Totals Chart",
          description: metricConfig.analyticsLabels.categoryTotalsDescription,
          chartDescription: `Bar chart showing total tracked ${metricConfig.label.toLowerCase()} by category.`,
          emptyMessage: metricConfig.analyticsLabels.chartEmpty,
          data: categoryBreakdown.map<DisplayBreakdownItem>((item) => ({
            category: item.category,
            total: item.total,
            detail: `${item.count} entries`,
          })),
          valueFormatter: metricConfig.formatValue,
          tooltipLabel: metricConfig.analyticsLabels.tooltipLabel,
        };

  return (
    <div className="space-y-4 sm:space-y-6">
      <section className="overflow-hidden rounded-[2rem] border border-white/80 bg-white/90 p-4 shadow-xl shadow-[var(--metric-shadow)] sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-950 sm:text-3xl">Analytics</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Review derived insights based on your tracked {metricConfig.label.toLowerCase()} entries.
            </p>
          </div>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Time Range
              </label>
              <select
                value={selectedRange}
                onChange={(event) =>
                  setSelectedRange(event.target.value as TimeRangeFilter)
                }
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-[var(--metric-primary)] focus:ring-4 focus:ring-[var(--metric-ring)] sm:w-auto"
              >
                {TIME_RANGE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="rounded-2xl border border-[var(--metric-ring)] bg-[var(--metric-primary-soft)] px-4 py-3 text-sm font-semibold text-[var(--metric-primary)]">
              {analyticsBreakdown.data.length} active groups
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          ["Total Entries", totalEntries.toString(), "bg-[var(--metric-primary-soft)] text-[var(--metric-primary)]"],
          [
            metricConfig.analyticsLabels.total,
            metricConfig.formatValue(totalMetricValue),
            "bg-[var(--metric-secondary-soft)] text-[var(--metric-secondary)]",
          ],
          [
            metricConfig.analyticsLabels.averagePerEntry,
            metricConfig.formatValue(averageMetricValue),
            "bg-[var(--metric-tertiary-soft)] text-[var(--metric-tertiary)]",
          ],
          [metricConfig.analyticsLabels.topCategory, topMetricCategory, "bg-[var(--metric-primary-soft)] text-[var(--metric-primary-dark)]"],
        ].map(([label, value, tone]) => (
          <div
            key={label}
            className="rounded-[2rem] border border-white/80 bg-white/90 p-4 shadow-lg shadow-[var(--metric-shadow)] transition hover:-translate-y-1 hover:shadow-xl sm:p-5"
          >
            <p className="text-sm font-semibold text-slate-500">{label}</p>
            <div className="mt-4 flex items-end justify-between gap-3 sm:mt-5">
              <h3 className="min-w-0 break-words text-2xl font-bold text-slate-950 sm:text-3xl">{value}</h3>
              <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${tone}`}>
                Live
              </span>
            </div>
          </div>
        ))}
      </section>

      {isCalories && (
        <section className="grid gap-4 sm:grid-cols-3">
          {[
            ["Protein", formatMacroValue(macroTotals.proteinGrams), "bg-[var(--metric-primary-soft)] text-[var(--metric-primary)]"],
            ["Carbs", formatMacroValue(macroTotals.carbsGrams), "bg-[var(--metric-secondary-soft)] text-[var(--metric-secondary)]"],
            ["Fat", formatMacroValue(macroTotals.fatGrams), "bg-[var(--metric-tertiary-soft)] text-[var(--metric-tertiary)]"],
          ].map(([label, value, tone]) => (
            <div
              key={label}
              className="rounded-[2rem] border border-white/80 bg-white/90 p-4 shadow-lg shadow-[var(--metric-shadow)] sm:p-5"
            >
              <p className="text-sm font-semibold text-slate-500">{label}</p>
              <div className="mt-4 flex items-end justify-between gap-3 sm:mt-5">
                <h3 className="min-w-0 break-words text-2xl font-bold text-slate-950 sm:text-3xl">{value}</h3>
                <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${tone}`}>
                  Macro
                </span>
              </div>
            </div>
          ))}
        </section>
      )}

      <section className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-[2rem] border border-white/80 bg-white/90 p-4 shadow-xl shadow-[var(--metric-shadow)] sm:p-6">
          <h3 className="text-lg font-semibold text-slate-900">{analyticsBreakdown.title}</h3>
          <p className="mt-1 text-sm text-slate-500">
            {analyticsBreakdown.description}
          </p>

          <div className="mt-5 space-y-3">
            {analyticsBreakdown.data.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-500">
                {analyticsBreakdown.emptyMessage}
              </div>
            ) : (
              analyticsBreakdown.data.map((item) => (
                <div
                  key={item.category}
                  className="flex flex-col items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 transition hover:-translate-y-0.5 hover:border-[var(--metric-primary)] hover:bg-white sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <p className="break-words text-sm font-medium text-slate-900">{item.category}</p>
                    <p className="mt-1 break-words text-xs text-slate-500">
                      {item.detail}
                    </p>
                  </div>

                  <span className="max-w-full break-words rounded-full bg-white px-3 py-1 text-sm font-semibold text-slate-700 shadow-sm">
                    {analyticsBreakdown.valueFormatter(item.total)}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="rounded-[2rem] border border-white/80 bg-white/90 p-4 shadow-xl shadow-[var(--metric-shadow)] sm:p-6">
          <h3 className="text-lg font-semibold text-slate-900">Latest Recorded Entry</h3>
          <p className="mt-1 text-sm text-slate-500">
            Most recent item based on entry date.
          </p>

          <div className="mt-5">
            {latestEntry ? (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 transition hover:border-[var(--metric-primary)]">
                <p className="break-words text-lg font-semibold text-slate-900">{latestEntry.title}</p>
                <p className="mt-2 break-words text-sm text-slate-500">
                  {latestEntry.category} - {formatDisplayDate(latestEntry.date)}
                </p>
                <p className="mt-3 break-words text-sm font-medium text-slate-700">
                  {metricConfig.inputLabel}: {metricConfig.formatValue(latestEntry.value)}
                </p>
                {isCalories && (
                  <div className="mt-3 grid gap-2 text-sm text-slate-600 sm:grid-cols-3">
                    <span className="break-words">Protein {formatMacroValue(latestEntry.proteinGrams ?? 0)}</span>
                    <span className="break-words">Carbs {formatMacroValue(latestEntry.carbsGrams ?? 0)}</span>
                    <span className="break-words">Fat {formatMacroValue(latestEntry.fatGrams ?? 0)}</span>
                  </div>
                )}
                {latestEntry.note && (
                  <p className="mt-2 break-words text-sm leading-6 text-slate-600">{latestEntry.note}</p>
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
        <div className="min-w-0 rounded-[2rem] border border-white/80 bg-white/90 p-4 shadow-xl shadow-[var(--metric-shadow)] sm:p-6">
          <h3 className="text-lg font-semibold text-slate-900">{analyticsBreakdown.chartTitle}</h3>
          <p className="mt-1 text-sm text-slate-500">
            {analyticsBreakdown.chartDescription}
          </p>

          <div className="mt-5 h-64 min-w-0 sm:mt-6 sm:h-72">
            <CategoryTotalsChart
              data={analyticsBreakdown.data}
              valueFormatter={analyticsBreakdown.valueFormatter}
              emptyMessage={analyticsBreakdown.emptyMessage}
              tooltipLabel={analyticsBreakdown.tooltipLabel}
            />
          </div>
        </div>

        <div className="min-w-0 rounded-[2rem] border border-white/80 bg-white/90 p-4 shadow-xl shadow-[var(--metric-shadow)] sm:p-6">
          <h3 className="text-lg font-semibold text-slate-900">
            {metricConfig.analyticsLabels.trendTitle}
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            {metricConfig.analyticsLabels.trendDescription}
          </p>

          <div className="mt-5 h-64 min-w-0 sm:mt-6 sm:h-72">
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
