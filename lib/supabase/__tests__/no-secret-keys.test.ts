import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join, resolve } from "node:path";

/*
 * Criterion 1.6: no Supabase secret may reach the browser bundle. The cheapest
 * durable guarantee is that the identifiers simply do not exist in app code —
 * anything privileged would have to be named to be used.
 */
const ROOT = process.cwd();
const SCANNED = ["app", "components", "lib", "state"];
const FORBIDDEN = /SERVICE_ROLE|SECRET_KEY|JWT_SECRET/;

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const path = join(dir, entry);
    if (entry === "node_modules" || entry === "__tests__") return [];
    if (statSync(path).isDirectory()) return walk(path);
    return /\.tsx?$/.test(entry) ? [path] : [];
  });
}

const sources = () => SCANNED.flatMap((dir) => walk(resolve(ROOT, dir)));

describe("no privileged Supabase credential in app code (1.6)", () => {
  it("names no service-role, secret or JWT-secret variable", () => {
    const offenders = sources().filter((file) =>
      FORBIDDEN.test(readFileSync(file, "utf8")),
    );

    expect(offenders).toEqual([]);
  });

  it("reads no Supabase environment variable that is not NEXT_PUBLIC_", () => {
    const offenders = sources().flatMap((file) => {
      const matches =
        readFileSync(file, "utf8").match(/process\.env\.([A-Z0-9_]+)/g) ?? [];
      return matches
        .map((match) => match.replace("process.env.", ""))
        .filter((name) => /SUPABASE/.test(name) && !name.startsWith("NEXT_PUBLIC_"))
        .map((name) => `${file}: ${name}`);
    });

    expect(offenders).toEqual([]);
  });
});

describe(".env.example is the environment contract (1.5)", () => {
  const path = resolve(ROOT, ".env.example");
  const contents = existsSync(path) ? readFileSync(path, "utf8") : "";

  it("is committed", () => {
    expect(existsSync(path)).toBe(true);
  });

  it("declares both variables the app reads", () => {
    expect(contents).toContain("NEXT_PUBLIC_SUPABASE_URL");
    expect(contents).toContain("NEXT_PUBLIC_SUPABASE_ANON_KEY");
  });

  it("declares nothing that is not NEXT_PUBLIC_", () => {
    const declared = [...contents.matchAll(/^([A-Z0-9_]+)=/gm)].map((m) => m[1]);

    expect(declared.length).toBeGreaterThan(0);
    expect(declared.filter((name) => !name.startsWith("NEXT_PUBLIC_"))).toEqual([]);
  });

  it("carries the local URL as its default", () => {
    expect(contents).toContain("NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321");
  });

  it("leaves the key blank and says where to get it", () => {
    // The anon key is generated per local project, so there is no honest
    // default to commit — only a pointer to the command that prints it.
    expect(contents).toMatch(/^NEXT_PUBLIC_SUPABASE_ANON_KEY=\s*$/m);
    expect(contents).toContain("supabase status");
  });
});

describe("local secrets stay out of git", () => {
  it("ignores .env*.local", () => {
    const gitignore = readFileSync(resolve(ROOT, ".gitignore"), "utf8");

    expect(gitignore).toContain(".env*.local");
  });
});
