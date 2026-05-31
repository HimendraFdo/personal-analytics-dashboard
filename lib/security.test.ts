import { describe, expect, it } from "vitest";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const projectRoot = path.resolve(__dirname, "..");
const ignoredDirs = new Set([
  ".codex",
  ".git",
  ".next",
  "coverage",
  "node_modules",
  "personal-analytics-course",
]);
const scannedExtensions = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs"]);
const unsafePrismaApis = /\$queryRawUnsafe|\$executeRawUnsafe/;
const placeholderMarkers =
  /placeholder|example|USER:PASSWORD@HOST|APP_USER:PASSWORD@HOST|MIGRATION_USER:PASSWORD@HOST|ci:ci@localhost/i;
const obviousSecretPatterns = [
  {
    name: "Clerk secret key",
    pattern: new RegExp(`sk_${"(?:test|live)"}_`),
  },
  {
    name: "PostgreSQL connection string",
    pattern: new RegExp(`postgresql:${"/" + "/"}`, "i"),
  },
];

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

describe("tracked secret hygiene", () => {
  it("does not track a local .env file", () => {
    const trackedEnv = execFileSync("git", ["ls-files", ".env"], {
      cwd: projectRoot,
      encoding: "utf8",
    }).trim();

    expect(trackedEnv).toBe("");
  });

  it("does not commit obvious non-placeholder secrets", () => {
    const trackedFiles = execFileSync("git", ["ls-files", "-z"], {
      cwd: projectRoot,
      encoding: "utf8",
    })
      .split("\0")
      .filter(Boolean);
    const offenders: string[] = [];

    for (const relativeFile of trackedFiles) {
      const file = path.join(projectRoot, relativeFile);
      let source: string;

      try {
        source = fs.readFileSync(file, "utf8");
      } catch {
        continue;
      }

      if (source.includes("\0")) {
        continue;
      }

      source.split(/\r?\n/).forEach((line, index) => {
        if (
          !placeholderMarkers.test(line) &&
          obviousSecretPatterns.some(({ pattern }) => pattern.test(line))
        ) {
          offenders.push(`${relativeFile}:${index + 1}`);
        }
      });
    }

    expect(offenders).toEqual([]);
  });
});

describe("Entry RLS safety net", () => {
  it("enables forced row level security and all Entry policies", () => {
    const migration = fs.readFileSync(
      path.join(
        projectRoot,
        "prisma",
        "migrations",
        "20260530110000_enable_entry_rls",
        "migration.sql"
      ),
      "utf8"
    );

    expect(migration).toContain(
      'ALTER TABLE "Entry" ENABLE ROW LEVEL SECURITY;'
    );
    expect(migration).toContain(
      'ALTER TABLE "Entry" FORCE ROW LEVEL SECURITY;'
    );
    expect(migration).toContain("CREATE POLICY entry_user_select");
    expect(migration).toContain("CREATE POLICY entry_user_insert");
    expect(migration).toContain("CREATE POLICY entry_user_update");
    expect(migration).toContain("CREATE POLICY entry_user_delete");
    expect(migration).toContain("current_setting('app.current_user_id', true)");
  });

  it("sets the RLS user context transaction-locally with parameterized SQL", () => {
    const prismaSource = fs.readFileSync(
      path.join(projectRoot, "lib", "prisma.ts"),
      "utf8"
    );

    expect(prismaSource).toContain("prisma.$transaction");
    expect(prismaSource).toContain(
      "tx.$executeRaw`SELECT set_config('app.current_user_id', ${userId}, true)`"
    );
    expect(prismaSource).not.toContain("SET app.current_user_id");
  });

  it("keeps protected API Entry operations inside the RLS helper", () => {
    const routeFiles = [
      path.join(projectRoot, "app", "api", "entries", "route.ts"),
      path.join(projectRoot, "app", "api", "entries", "[id]", "route.ts"),
    ];

    for (const file of routeFiles) {
      const source = fs.readFileSync(file, "utf8");
      expect(source).toContain("withRlsUserContext(userId");
      expect(source).not.toMatch(/prisma\.entry\./);
    }
  });
});
