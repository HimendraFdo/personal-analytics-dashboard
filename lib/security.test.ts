import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

const projectRoot = path.resolve(__dirname, "..");
const ignoredDirs = new Set([
  ".git",
  ".next",
  "coverage",
  "node_modules",
  "personal-analytics-course",
]);
const scannedExtensions = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs"]);
const unsafePrismaApis = /\$queryRawUnsafe|\$executeRawUnsafe/;

function collectSourceFiles(directory: string): string[] {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      return ignoredDirs.has(entry.name) ? [] : collectSourceFiles(fullPath);
    }

    if (
      !entry.isFile() ||
      entry.name.includes(".test.") ||
      !scannedExtensions.has(path.extname(entry.name))
    ) {
      return [];
    }

    return [fullPath];
  });
}

describe("Prisma raw SQL safety", () => {
  it("does not use unsafe raw Prisma APIs in application source", () => {
    const offenders = collectSourceFiles(projectRoot).filter((file) =>
      unsafePrismaApis.test(fs.readFileSync(file, "utf8"))
    );

    expect(offenders.map((file) => path.relative(projectRoot, file))).toEqual(
      []
    );
  });
});
