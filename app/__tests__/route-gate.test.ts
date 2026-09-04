import { readFileSync } from "node:fs";
import { resolve } from "node:path";

/*
 * A source-level test, deliberately. A Server Component that reads
 * `next/headers` cannot be rendered under jsdom, so the only way to assert
 * that the gate is a *route* boundary — the thing criterion 4.4 asks for — is
 * to assert the shape of the files that make it one.
 */
const read = (path: string) => readFileSync(resolve(process.cwd(), path), "utf8");

describe("the book is a server-gated route (4.2, 4.4)", () => {
  const page = read("app/page.tsx");

  it("is a Server Component", () => {
    expect(page).not.toMatch(/["']use client["']/);
  });

  it("asks who is signed in before rendering anything", () => {
    expect(page).toMatch(/requireSessionUser\(\)/);
  });

  it("holds no ssr:false dynamic import of its own", () => {
    // `next/dynamic` with `ssr: false` is not allowed in a Server Component;
    // the call moved down to BookMount so the gate could move up to the route.
    expect(page).not.toMatch(/dynamic\(/);
  });
});

describe("the date-dependent book stays client-only, below the gate (4.4)", () => {
  const mount = read("components/book/BookMount.tsx");

  it("is a Client Component", () => {
    expect(mount).toMatch(/["']use client["']/);
  });

  it("owns the ssr:false dynamic import", () => {
    expect(mount).toMatch(/dynamic\(/);
    expect(mount).toMatch(/ssr:\s*false/);
  });
});

describe("la entrada never renders for someone already signed in (4.3)", () => {
  const page = read("app/entrada/page.tsx");

  it("is a Server Component", () => {
    expect(page).not.toMatch(/["']use client["']/);
  });

  it("checks for a session and redirects when there is one", () => {
    expect(page).toMatch(/getSessionUser\(\)/);
    expect(page).toMatch(/redirect\(/);
  });
});

describe("the server-only guard is where it belongs", () => {
  it("marks the session DAL as server-only", () => {
    expect(read("lib/auth/session.ts")).toMatch(/["']server-only["']/);
  });

  it("keeps the testable core free of it", () => {
    // The guard would throw the moment vitest imported the module, so the
    // logic lives beside it rather than inside it.
    expect(read("lib/auth/session-core.ts")).not.toMatch(/["']server-only["']/);
  });
});
