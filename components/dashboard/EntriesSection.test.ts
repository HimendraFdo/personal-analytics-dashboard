import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const entriesSectionSource = readFileSync(
  join(process.cwd(), "components/dashboard/EntriesSection.tsx"),
  "utf8"
);

const moneyImportPanelSource = readFileSync(
  join(process.cwd(), "components/dashboard/MoneyImportPanel.tsx"),
  "utf8"
);

describe("EntriesSection money import UI contract", () => {
  it("renders the statement import panel only for the Money metric", () => {
    expect(entriesSectionSource).toContain('activeMetric === "money"');
    expect(entriesSectionSource).toContain("<MoneyImportPanel");
    expect(entriesSectionSource).toContain("onImportComplete");
  });

  it("keeps the upload input scoped to supported statement file types", () => {
    expect(moneyImportPanelSource).toContain(
      'accept="application/pdf,image/png,image/jpeg"'
    );
    expect(moneyImportPanelSource).toContain("Import statement");
    expect(moneyImportPanelSource).toContain("Import selected");
  });
});
