import { describe, expect, it } from "vitest";
import { metricConfigs, parseMetricType } from "./metrics";

describe("metricConfigs", () => {
  it("formats money values as USD currency", () => {
    expect(metricConfigs.money.formatValue(12.5)).toBe("$12.50");
    expect(metricConfigs.money.formatValue(1250)).toBe("$1,250.00");
  });

  it("exposes money-specific labels", () => {
    expect(metricConfigs.money.dashboardLabels.total).toBe("Total Spent");
    expect(metricConfigs.money.dashboardLabels.averagePerDay).toBe("Avg Spend / Day");
    expect(metricConfigs.money.analyticsLabels.averagePerEntry).toBe("Avg Spend / Entry");
    expect(metricConfigs.money.analyticsLabels.trendTitle).toBe("Spending Over Time");
    expect(metricConfigs.money.analyticsLabels.tooltipLabel).toBe("Total Spent");
    expect(metricConfigs.money.emptyState.heading).toBe("No money entries yet");
    expect(metricConfigs.money.sortLabels.highest).toBe("Highest Spend");
    expect(metricConfigs.money.sortLabels.lowest).toBe("Lowest Spend");
  });

  it("formats calories with kcal and thousands separators", () => {
    expect(metricConfigs.calories.formatValue(450)).toBe("450 kcal");
    expect(metricConfigs.calories.formatValue(1250)).toBe("1,250 kcal");
  });

  it("exposes calories-specific labels", () => {
    expect(metricConfigs.calories.inputLabel).toBe("Calories Eaten");
    expect(metricConfigs.calories.dashboardLabels.total).toBe("Total Calories");
    expect(metricConfigs.calories.dashboardLabels.averagePerDay).toBe("Avg Calories / Day");
    expect(metricConfigs.calories.analyticsLabels.averagePerEntry).toBe("Avg Calories / Entry");
    expect(metricConfigs.calories.analyticsLabels.trendTitle).toBe("Calories Over Time");
    expect(metricConfigs.calories.emptyState.heading).toBe("No calories entries yet");
    expect(metricConfigs.calories.sortLabels.highest).toBe("Highest Calories");
    expect(metricConfigs.calories.sortLabels.lowest).toBe("Lowest Calories");
  });
});

describe("parseMetricType", () => {
  it("accepts money from URL parameters", () => {
    expect(parseMetricType("money")).toBe("money");
  });

  it("accepts calories from URL parameters", () => {
    expect(parseMetricType("calories")).toBe("calories");
  });
});
