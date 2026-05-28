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
});

describe("parseMetricType", () => {
  it("accepts money from URL parameters", () => {
    expect(parseMetricType("money")).toBe("money");
  });
});
