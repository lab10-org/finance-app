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

describe("the expenses table (2.4, 11.1, 12.1)", () => {
  it("creates the table", () => {
    expect(allSql()).toMatch(/create\s+table\s+public\.expenses/i);
  });

  it("enables row level security", () => {
    expect(allSql()).toMatch(/alter\s+table\s+public\.expenses\s+enable\s+row\s+level\s+security/i);
  });

  it("declares a policy for each of the four operations", () => {
    const sql = allSql();
    for (const op of ["select", "insert", "update", "delete"]) {
      expect(sql).toMatch(new RegExp(`create\\s+policy[\\s\\S]{0,120}?for\\s+${op}\\b`, "i"));
    }
  });

  it("compares against `(select auth.uid())`, not a bare call", () => {
    // The bare form is re-evaluated per row; the subquery is evaluated once per
    // statement. On a month of expenses the difference is measurable.
    const sql = allSql();
    expect(sql).toMatch(/\(\s*select\s+auth\.uid\(\)\s*\)/i);
    expect(sql).not.toMatch(/=\s*auth\.uid\(\)/i);
  });

  it("indexes the read path and excludes soft-deleted rows from it", () => {
    expect(allSql()).toMatch(
      /create\s+index[\s\S]{0,120}?on\s+public\.expenses[\s\S]{0,120}?where\s+deleted_at\s+is\s+null/i,
    );
  });

  it("makes client_op_id unique per account, so a retry cannot duplicate (5.8)", () => {
    expect(allSql()).toMatch(
      /create\s+unique\s+index[\s\S]{0,160}?client_op_id/i,
    );
  });

  it("puts no check and no enum on category_id (11.1)", () => {
    const sql = allSql();
    expect(sql).not.toMatch(/create\s+type[\s\S]{0,80}?category/i);
    expect(sql).not.toMatch(/category_id[^\n]*\bcheck\b/i);
  });
});
