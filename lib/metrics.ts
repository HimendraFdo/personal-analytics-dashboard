import type { MetricType } from "@/types/entry";

export const METRIC_TYPES: MetricType[] = ["time", "money", "calories"];
const compactNumberFormatter = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 1,
});

export type MetricAccent = "teal" | "emerald" | "orange";

export type MetricConfig = {
  label: string;
  unit: string;
  accent: MetricAccent;
  inputLabel: string;
  valueInput: {
    step: string;
    placeholder: string;
  };
  placeholders: {
    title: string;
    note: string;
  };
  emptyState: {
    heading: string;
    description: string;
  };
  dashboardLabels: {
    total: string;
    averagePerDay: string;
  };
  analyticsLabels: {
    total: string;
    averagePerEntry: string;
    topCategory: string;
    trendTitle: string;
    trendDescription: string;
    categoryTotalsDescription: string;
    tooltipLabel: string;
    chartEmpty: string;
    latestEmpty: string;
  };
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
    valueInput: {
      step: "1",
      placeholder: "e.g. 45",
    },
    placeholders: {
      title: "e.g. Deep work session",
      note: "Optional note",
    },
    emptyState: {
      heading: "No time entries yet",
      description:
        "Start tracking study, finance, health, or personal time in minutes with your first entry.",
    },
    dashboardLabels: {
      total: "Total Minutes",
      averagePerDay: "Avg Minutes / Day",
    },
    analyticsLabels: {
      total: "Total Minutes",
      averagePerEntry: "Avg Minutes / Entry",
      topCategory: "Top Time Category",
      trendTitle: "Time Over Time",
      trendDescription: "Line chart showing total tracked time over time.",
      categoryTotalsDescription:
        "Total time accumulated within each category.",
      tooltipLabel: "Total Minutes",
      chartEmpty: "Add entries to see your activity trend.",
      latestEmpty: "No entries available yet.",
    },
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
    valueInput: {
      step: "0.01",
      placeholder: "e.g. 12.50",
    },
    placeholders: {
      title: "e.g. Lunch with team",
      note: "Optional spending note",
    },
    emptyState: {
      heading: "No money entries yet",
      description:
        "Track a purchase, bill, or subscription to start building your spending history.",
    },
    dashboardLabels: {
      total: "Total Spent",
      averagePerDay: "Avg Spend / Day",
    },
    analyticsLabels: {
      total: "Total Spent",
      averagePerEntry: "Avg Spend / Entry",
      topCategory: "Top Spending Category",
      trendTitle: "Spending Over Time",
      trendDescription: "Line chart showing total spending over time.",
      categoryTotalsDescription:
        "Total spending accumulated within each category.",
      tooltipLabel: "Total Spent",
      chartEmpty: "Add money entries to see your spending trend.",
      latestEmpty: "No money entries available yet.",
    },
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
    valueInput: {
      step: "1",
      placeholder: "e.g. 500",
    },
    placeholders: {
      title: "e.g. Lunch",
      note: "Optional note",
    },
    emptyState: {
      heading: "No calories entries yet",
      description:
        "Log calories manually or search for a food to capture calories, protein, carbs, and fats.",
    },
    dashboardLabels: {
      total: "Total Calories",
      averagePerDay: "Avg Calories / Day",
    },
    analyticsLabels: {
      total: "Total Calories",
      averagePerEntry: "Avg Calories / Entry",
      topCategory: "Top Calories Category",
      trendTitle: "Calories Over Time",
      trendDescription: "Line chart showing total tracked calories over time.",
      categoryTotalsDescription:
        "Total calories accumulated within each category.",
      tooltipLabel: "Total Calories",
      chartEmpty: "Add calorie entries to see your nutrition trend.",
      latestEmpty: "No calorie entries available yet.",
    },
    formatValue: (value) => `${compactNumberFormatter.format(value)} kcal`,
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
