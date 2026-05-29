import type { MetricType } from "@/types/entry";

export const METRIC_TYPES: MetricType[] = ["time", "money", "calories"];
const compactNumberFormatter = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 1,
});

export type MetricAccent = "teal" | "emerald" | "orange";

export type MetricPalette = {
  shell: string;
  shellMuted: string;
  panel: string;
  panelStrong: string;
  primary: string;
  primaryDark: string;
  primarySoft: string;
  secondary: string;
  secondarySoft: string;
  tertiary: string;
  tertiarySoft: string;
  textOnPrimary: string;
  ring: string;
  shadow: string;
  chartStart: string;
  chartMid: string;
  chartEnd: string;
};

export type MetricConfig = {
  label: string;
  unit: string;
  accent: MetricAccent;
  palette: MetricPalette;
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
    palette: {
      shell: "#eefdfa",
      shellMuted: "#f7fffd",
      panel: "#ffffff",
      panelStrong: "#082f2e",
      primary: "#0f766e",
      primaryDark: "#115e59",
      primarySoft: "#ccfbf1",
      secondary: "#2563eb",
      secondarySoft: "#dbeafe",
      tertiary: "#f59e0b",
      tertiarySoft: "#fef3c7",
      textOnPrimary: "#ffffff",
      ring: "rgba(20, 184, 166, 0.18)",
      shadow: "rgba(15, 118, 110, 0.18)",
      chartStart: "#14b8a6",
      chartMid: "#2563eb",
      chartEnd: "#f59e0b",
    },
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
    palette: {
      shell: "#effcf4",
      shellMuted: "#fbfff8",
      panel: "#ffffff",
      panelStrong: "#052e16",
      primary: "#15803d",
      primaryDark: "#166534",
      primarySoft: "#dcfce7",
      secondary: "#0f766e",
      secondarySoft: "#ccfbf1",
      tertiary: "#ca8a04",
      tertiarySoft: "#fef9c3",
      textOnPrimary: "#ffffff",
      ring: "rgba(34, 197, 94, 0.18)",
      shadow: "rgba(21, 128, 61, 0.18)",
      chartStart: "#22c55e",
      chartMid: "#0f766e",
      chartEnd: "#ca8a04",
    },
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
    palette: {
      shell: "#fff7ed",
      shellMuted: "#fffdfa",
      panel: "#ffffff",
      panelStrong: "#431407",
      primary: "#ea580c",
      primaryDark: "#c2410c",
      primarySoft: "#ffedd5",
      secondary: "#dc2626",
      secondarySoft: "#fee2e2",
      tertiary: "#65a30d",
      tertiarySoft: "#ecfccb",
      textOnPrimary: "#ffffff",
      ring: "rgba(249, 115, 22, 0.2)",
      shadow: "rgba(234, 88, 12, 0.18)",
      chartStart: "#f97316",
      chartMid: "#dc2626",
      chartEnd: "#65a30d",
    },
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
