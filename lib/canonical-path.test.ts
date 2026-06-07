import { describe, expect, it } from "vitest";
import { getCanonicalPathname } from "./canonical-path";

describe("getCanonicalPathname", () => {
  it("collapses repeated slashes in ordinary paths", () => {
    expect(getCanonicalPathname("/api//entries")).toBe("/api/entries");
  });

  it("redirects nested shell-route paths to the intended top-level route", () => {
    expect(getCanonicalPathname("/dashboard//entries")).toBe("/entries");
    expect(getCanonicalPathname("/dashboard/entries")).toBe("/entries");
    expect(getCanonicalPathname("/entries//analytics")).toBe("/analytics");
  });

  it("preserves valid top-level shell routes", () => {
    expect(getCanonicalPathname("/dashboard")).toBe("/dashboard");
    expect(getCanonicalPathname("/entries")).toBe("/entries");
    expect(getCanonicalPathname("/analytics")).toBe("/analytics");
  });
});
