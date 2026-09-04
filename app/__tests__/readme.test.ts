import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

/*
 * A thin test, deliberately: criterion 1.7 asks for documentation, and the
 * only thing a test can honestly assert about prose is that it still names the
 * commands it promises. It is what stops the README rotting silently when a
 * port or a command changes.
 */
const path = resolve(process.cwd(), "README.md");

describe("README documents the local stack (1.7)", () => {
  it("exists", () => {
    expect(existsSync(path)).toBe(true);
  });

  const readme = existsSync(path) ? readFileSync(path, "utf8") : "";

  it.each([
    "supabase start",
    "supabase stop",
    "supabase db reset",
    "supabase status",
    "http://127.0.0.1:54324",
    ".env.example",
    ".env.local",
  ])("names %s", (needle) => {
    expect(readme).toContain(needle);
  });

  it("says Docker has to be running", () => {
    expect(readme).toMatch(/Docker/);
  });
});
