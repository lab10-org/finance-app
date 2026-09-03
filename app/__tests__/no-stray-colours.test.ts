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

describe("no network surface at all (10.5)", () => {
  it("contains no fetch, server action or route handler", () => {
    const offenders = files(/\.tsx?$/)
      .flatMap((f) => {
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

  it("persists nothing in the browser", () => {
    const offenders = files(/\.tsx?$/)
      .filter((f) => /localStorage|sessionStorage|indexedDB|document\.cookie/.test(readFileSync(f, "utf8")));

    expect(offenders).toEqual([]);
  });
});
