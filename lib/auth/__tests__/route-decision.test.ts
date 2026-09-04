import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import {
  ENTRADA_PATH,
  LIBRO_PATH,
  decideRoute,
} from "@/lib/auth/route-decision";

describe("without a session, only la entrada is reachable (4.1, 4.2)", () => {
  it.each([LIBRO_PATH, "/cualquier-otra", "/manifest.webmanifest"])(
    "redirects %s to la entrada",
    (pathname) => {
      expect(decideRoute({ pathname, hasSession: false })).toEqual({
        kind: "redirect",
        to: ENTRADA_PATH,
      });
    },
  );

  it("lets la entrada itself render", () => {
    expect(decideRoute({ pathname: ENTRADA_PATH, hasSession: false })).toEqual({
      kind: "continue",
    });
  });
});

describe("with a session, la entrada never flashes (4.3, 5.1)", () => {
  it("sends someone already signed in from la entrada to the book", () => {
    expect(decideRoute({ pathname: ENTRADA_PATH, hasSession: true })).toEqual({
      kind: "redirect",
      to: LIBRO_PATH,
    });
  });

  it.each([LIBRO_PATH, "/cualquier-otra"])("lets %s render", (pathname) => {
    expect(decideRoute({ pathname, hasSession: true })).toEqual({ kind: "continue" });
  });
});

describe("proxy.ts is written for Next 16, not for the tutorials (5.3, 5.4)", () => {
  const source = readFileSync(resolve(process.cwd(), "proxy.ts"), "utf8");
  /** Comments explain the Next 16 rename, so they name the old convention. */
  const code = source.replace(/\/\*[\s\S]*?\*\/|\/\/[^\n]*/g, "");

  it("exports a function named proxy", () => {
    expect(source).toMatch(/export\s+async\s+function\s+proxy\s*\(/);
  });

  it("exports a matcher", () => {
    expect(source).toMatch(/export\s+const\s+config\s*=/);
    expect(source).toMatch(/matcher\s*:/);
  });

  it("uses no deprecated middleware identifier", () => {
    // Next 16 renamed the convention; every Supabase tutorial still says
    // `middleware.ts`, and a file by that name would simply never run.
    expect(code).not.toMatch(/middleware/i);
  });

  it("declares no runtime, because the proxy runtime is not configurable", () => {
    expect(code).not.toMatch(/export\s+const\s+runtime/);
  });

  it("refreshes the token with getClaims", () => {
    expect(source).toContain("getClaims");
  });

  it("carries the refreshed cookies onto a redirect", () => {
    // Skipping this copy is the standard way this pattern silently loses the
    // rotated token, so it is asserted rather than trusted.
    expect(source).toMatch(/response\.cookies\.getAll\(\)/);
  });
});
