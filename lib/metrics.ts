import type { MetricType } from "@/types/entry";

export const METRIC_TYPES: MetricType[] = ["time", "money", "calories"];

export type MetricAccent = "teal" | "emerald" | "orange";

export type MetricConfig = {
  label: string;
  unit: string;
  accent: MetricAccent;
  inputLabel: string;
  formatValue: (value: number) => string;
  sortLabels: {
    highest: string;
    lowest: string;
  };
};

export const metricConfigs: Record<MetricType, MetricConfig> = {
  time: {
    label: "Time",
    unit: "min",
    accent: "teal",
    inputLabel: "Time Spent (minutes)",
    formatValue: (value) => `${Number.isInteger(value) ? value : value.toFixed(1)} min`,
    sortLabels: {
      highest: "Highest Time",
      lowest: "Lowest Time",
    },
  },
  money: {
    label: "Money",
    unit: "$",
    accent: "emerald",
    inputLabel: "Money Spent",
    formatValue: (value) =>
      new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
      }).format(value),
    sortLabels: {
      highest: "Highest Spend",
      lowest: "Lowest Spend",
    },
  },
  calories: {
    label: "Calories",
    unit: "kcal",
    accent: "orange",
    inputLabel: "Calories Eaten",
    formatValue: (value) => `${Number.isInteger(value) ? value : value.toFixed(1)} kcal`,
    sortLabels: {
      highest: "Highest Calories",
      lowest: "Lowest Calories",
    },
  },
};

export function parseMetricType(value: string | null | undefined): MetricType {
  return METRIC_TYPES.includes(value as MetricType)
    ? (value as MetricType)
    : "time";
}
