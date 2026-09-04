import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

/*
 * Vitest cannot execute SQL. What it can do is hold the migration folder to the
 * rules that are cheap to break and expensive to notice: that the schema lives
 * in committed files at all (12.1), that they are ordered, and that a few
 * decisions the design argued for are actually present in the text.
 *
 * The behaviour of the SQL is asserted by pgTAP, under `supabase test db`.
 */

const MIGRATIONS = join(process.cwd(), "supabase", "migrations");

function migrationFiles(): string[] {
  return readdirSync(MIGRATIONS)
    .filter((name) => name.endsWith(".sql"))
    .sort();
}

function read(name: string): string {
  return readFileSync(join(MIGRATIONS, name), "utf8");
}

/** Every migration's text, concatenated in order. */
function allSql(): string {
  return migrationFiles().map(read).join("\n");
}

describe("the migration folder (12.1)", () => {
  it("exists and is not empty", () => {
    expect(migrationFiles().length).toBeGreaterThan(0);
  });

  it("names every file with a sortable timestamp prefix", () => {
    for (const name of migrationFiles()) {
      expect(name).toMatch(/^\d{14}_[a-z0-9_]+\.sql$/);
    }
  });

  it("keeps the timestamps unique, so the order can never be ambiguous", () => {
    const stamps = migrationFiles().map((name) => name.slice(0, 14));
    expect(new Set(stamps).size).toBe(stamps.length);
  });
});

describe("uuid_generate_v7 (10.8, 12.1)", () => {
  it("is defined by a migration", () => {
    expect(allSql()).toMatch(/create\s+(or\s+replace\s+)?function\s+public\.uuid_generate_v7/i);
  });

  it("stamps version 7 rather than leaving gen_random_uuid's version 4", () => {
    // 0x70 is the version nibble; a function that never writes it is a v4 with
    // a timestamp glued on, which sorts correctly and still lies about itself.
    expect(allSql()).toMatch(/112|0x70|x'70'/);
  });
});
