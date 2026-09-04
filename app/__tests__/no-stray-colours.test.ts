import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, resolve } from "node:path";

import { describe, expect, it } from "vitest";

const ROOT = process.cwd();
const SCANNED = ["app", "components", "lib", "state"];

/** The token table in docs/mockups/v1.pen — the only colours that may exist. */
const TOKEN_VALUES = new Set(
  [
    "#F4F4F2", "#FFFFFF", "#E7E7E2", "#EDEDE9",
    "#15171B", "#7C808A", "#A2A6AE",
    "#2A4BA0", "#EBEFF8", "#F0F0EC",
    "#4E6DB4", "#7A90C9", "#A9B6DC", "#D7DDEE",
  ].map((c) => c.toLowerCase()),
);

function walk(dir: string, ext: RegExp): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const path = join(dir, entry);
    if (entry === "node_modules" || entry === "__tests__") return [];
    if (statSync(path).isDirectory()) return walk(path, ext);
    return ext.test(entry) ? [path] : [];
  });
}

const files = (ext: RegExp) =>
  SCANNED.flatMap((dir) => walk(resolve(ROOT, dir), ext));

describe("no colour outside the token table (11.4)", () => {
  it("uses no raw hex in any stylesheet but the token file itself", () => {
    const offenders = files(/\.css$/)
      .filter((f) => !f.endsWith("globals.css"))
      .flatMap((f) => (readFileSync(f, "utf8").match(/#[0-9a-fA-F]{3,8}\b/g) ?? []).map((hex) => `${f}: ${hex}`));

    expect(offenders).toEqual([]);
  });

  it("uses no rgb/hsl colour function in any stylesheet", () => {
    const offenders = files(/\.css$/)
      .flatMap((f) => (readFileSync(f, "utf8").match(/\b(rgba?|hsla?)\(/g) ?? []).map((fn) => `${f}: ${fn}`));

    expect(offenders).toEqual([]);
  });

  it("uses only token values for the few hex literals TypeScript needs", () => {
    const offenders = files(/\.tsx?$/)
      .flatMap((f) => (readFileSync(f, "utf8").match(/#[0-9a-fA-F]{6}\b/g) ?? []).map((hex) => ({ f, hex })))
      .filter(({ hex }) => !TOKEN_VALUES.has(hex.toLowerCase()))
      .map(({ f, hex }) => `${f}: ${hex}`);

    expect(offenders).toEqual([]);
  });
});

/*
 * This block used to assert the app had no network surface *at all*, which is
 * how v1 encoded its criterion 10.5. The Supabase Auth feature gave the app a
 * network surface and a persisted credential, so that assertion became false —
 * it kept passing only because the transport hides inside `@supabase/*` and
 * `proxy.ts` is not scanned. A green test asserting something untrue is worse
 * than no test, because it is still trusted.
 *
 * It is therefore narrowed to what 10.5 actually protects: no *expense* data
 * leaves the device. The modules that own expenses are scanned; the three that
 * exist to talk to the auth service are exempt by name.
 */
const EXPENSE_DIRS = ["components/book", "components/sheet", "state", "lib/domain"];
const EXPENSE_FILES = ["lib/seed.ts"];

/** The modules that exist to talk to the auth service. */
const AUTH_DIRS = ["lib/supabase", "lib/auth", "components/entrada"];

/** Every place a Supabase import may legitimately appear. */
const SUPABASE_DIRS = [...AUTH_DIRS, "lib/expenses"];
const SUPABASE_FILES = ["app/page.tsx"];

const expenseSources = () => [
  ...EXPENSE_DIRS.flatMap((dir) => walk(resolve(ROOT, dir), /\.tsx?$/)),
  ...EXPENSE_FILES.map((file) => resolve(ROOT, file)),
];

/*
 * Expenses now live in the database, so "no expense data leaves the device" is
 * no longer true and no longer the point. What these assertions protect is the
 * shape of the route out: expenses reach Supabase through `lib/expenses` and
 * nothing else, the components and the reducer open no transport of their own,
 * and nothing caches a peso in the browser.
 */
describe("expenses leave the device only through the repository", () => {
  it("opens no transport from the modules that own expenses", () => {
    const offenders = expenseSources().flatMap((f) => {
      const source = readFileSync(f, "utf8");
      const hits: string[] = [];
      if (/\bfetch\s*\(/.test(source)) hits.push("fetch(");
      if (/["']use server["']/.test(source)) hits.push("use server");
      if (/export\s+async\s+function\s+(GET|POST|PUT|PATCH|DELETE)\b/.test(source)) {
        hits.push("route handler");
      }
      if (/XMLHttpRequest|navigator\.sendBeacon|new WebSocket/.test(source)) hits.push("transport");
      return hits.map((h) => `${f}: ${h}`);
    });

    expect(offenders).toEqual([]);
  });

  it("persists no expense in the browser", () => {
    const offenders = expenseSources().filter((f) =>
      /localStorage|sessionStorage|indexedDB|document\.cookie/.test(readFileSync(f, "utf8")),
    );

    expect(offenders).toEqual([]);
  });

  it("reaches Supabase from nowhere but the auth and expense modules", () => {
    // The exemption is a whitelist, not a hole. `lib/expenses` joined it when
    // expenses moved into the database: it is the one place that may build a
    // statement, which is what keeps the query shape and the RLS assumption in
    // a single reviewable file. `app/page.tsx` joined it because the window is
    // read on the server, before the book is painted (3.1).
    const offenders = files(/\.tsx?$/)
      .filter((f) => /from\s+["'](@supabase\/|@\/lib\/supabase)/.test(readFileSync(f, "utf8")))
      .filter((f) => !SUPABASE_DIRS.some((dir) => f.includes(resolve(ROOT, dir))))
      .filter((f) => !SUPABASE_FILES.some((file) => f === resolve(ROOT, file)))
      .map((f) => f.replace(`${ROOT}/`, ""));

    expect(offenders).toEqual([]);
  });

  it("keeps the components and the store away from Supabase", () => {
    // Widening the list above must not quietly widen it for everything: the
    // book's components and its reducer still reach the database only through
    // the repository they are given.
    const offenders = ["components", "state"]
      .flatMap((dir) => walk(resolve(ROOT, dir), /\.tsx?$/))
      .filter((f) => /from\s+["'](@supabase\/|@\/lib\/supabase)/.test(readFileSync(f, "utf8")))
      .filter((f) => !AUTH_DIRS.some((dir) => f.includes(resolve(ROOT, dir))))
      .map((f) => f.replace(`${ROOT}/`, ""));

    expect(offenders).toEqual([]);
  });
});
