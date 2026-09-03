import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

const read = (rel: string) => readFileSync(resolve(process.cwd(), rel), "utf8");

const globals = read("app/globals.css");
const pageStyles = read("app/page.module.css");

/** The token table in docs/mockups/v1.pen — the single source of truth (11.4). */
const COLOR_TOKENS: Record<string, string> = {
  bg: "#F4F4F2",
  surface: "#FFFFFF",
  border: "#E7E7E2",
  divider: "#EDEDE9",
  "text-primary": "#15171B",
  "text-secondary": "#7C808A",
  "text-tertiary": "#A2A6AE",
  accent: "#2A4BA0",
  "accent-soft": "#EBEFF8",
  "icon-bg": "#F0F0EC",
  "accent-2": "#4E6DB4",
  "accent-3": "#7A90C9",
  "accent-4": "#A9B6DC",
  "accent-5": "#D7DDEE",
};

describe("design tokens (11.4)", () => {
  it.each(Object.entries(COLOR_TOKENS))("declares --%s as %s", (name, value) => {
    expect(globals).toMatch(new RegExp(`--${name}:\\s*${value};`, "i"));
  });

  it("declares the numeric tokens from the mockup", () => {
    expect(globals).toMatch(/--screen-pad:\s*24px;/);
    expect(globals).toMatch(/--radius-card:\s*16px;/);
  });

  it("declares both type families", () => {
    expect(globals).toMatch(/--font-ui:[^;]*Inter/);
    expect(globals).toMatch(/--font-num:[^;]*IBM Plex Mono/);
  });

  it("contains no colour outside the token table", () => {
    const hexes = globals.match(/#[0-9a-fA-F]{3,8}\b/g) ?? [];
    const allowed = new Set(Object.values(COLOR_TOKENS).map((c) => c.toLowerCase()));
    const strays = hexes.filter((h) => !allowed.has(h.toLowerCase()));
    expect(strays).toEqual([]);
  });
});

describe("mobile shell (11.1, 11.3)", () => {
  it("centres the book in a 390px column", () => {
    expect(pageStyles).toMatch(/max-width:\s*390px/);
    expect(pageStyles).toMatch(/margin-inline:\s*auto/);
  });
});
