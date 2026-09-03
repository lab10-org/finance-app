import { existsSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import manifest from "@/app/manifest";

describe("installable manifest (11.2)", () => {
  const m = manifest();

  it("names the app in Spanish", () => {
    expect(m.name).toBe("Libro de gastos");
    expect(m.short_name).toBe("Gastos");
  });

  it("opens standalone from the root", () => {
    expect(m.display).toBe("standalone");
    expect(m.start_url).toBe("/");
    expect(m.lang).toBe("es-CO");
  });

  it("takes its colours from the token table", () => {
    expect(m.background_color).toBe("#F4F4F2");
    expect(m.theme_color).toBe("#F4F4F2");
  });

  it("ships a 192px and a 512px icon", () => {
    const sizes = (m.icons ?? []).map((i) => i.sizes);
    expect(sizes).toContain("192x192");
    expect(sizes).toContain("512x512");

    for (const icon of m.icons ?? []) {
      expect(existsSync(resolve(process.cwd(), "public", icon.src!.replace(/^\//, "")))).toBe(true);
    }
  });
});
