import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

/*
 * The Cloudflare setup is three files that have to agree with each other and
 * with the adapter's output layout. Nothing here reaches the network — these
 * are the mistakes that would otherwise only surface as a broken deploy.
 */
const ROOT = process.cwd();
const read = (name: string) => readFileSync(resolve(ROOT, name), "utf8");

/** `wrangler.jsonc` is JSON with comments, and the comments carry the reasons. */
function parseJsonc(source: string): Record<string, unknown> {
  const withoutBlocks = source.replace(/\/\*[\s\S]*?\*\//g, "");
  const withoutLines = withoutBlocks
    .split("\n")
    .filter((line) => !line.trim().startsWith("//"))
    .join("\n");
  return JSON.parse(withoutLines);
}

describe("wrangler.jsonc matches what the adapter emits", () => {
  const config = parseJsonc(read("wrangler.jsonc"));

  it("points `main` at the generated worker", () => {
    expect(config.main).toBe(".open-next/worker.js");
  });

  it("serves the generated assets directory", () => {
    expect(config.assets).toMatchObject({
      directory: ".open-next/assets",
      binding: "ASSETS",
    });
  });

  it("enables nodejs_compat", () => {
    // `proxy.ts` runs on the Node.js runtime and Next 16 does not let that be
    // configured, so this flag is what keeps the session gate working at all.
    expect(config.compatibility_flags).toContain("nodejs_compat");
  });

  it("does not date the runtime ahead of the installed workerd", () => {
    // A compatibility_date in the future of the runtime is silently ignored,
    // so the deployed behaviour would quietly stop matching the file.
    const workerd = resolve(ROOT, "node_modules/workerd/package.json");
    if (!existsSync(workerd)) return;

    // workerd versions are `1.YYYYMMDD.N`.
    const [, stamp] = JSON.parse(readFileSync(workerd, "utf8")).version.split(".");
    const runtime = `${stamp.slice(0, 4)}-${stamp.slice(4, 6)}-${stamp.slice(6, 8)}`;

    expect(String(config.compatibility_date) <= runtime).toBe(true);
  });
});

describe("the deploy commands exist and are documented", () => {
  const scripts = JSON.parse(read("package.json")).scripts as Record<string, string>;
  const readme = read("README.md");

  it.each(["cf:build", "cf:preview", "cf:deploy", "cf:typegen"])(
    "package.json defines %s",
    (name) => {
      expect(scripts[name]).toBeTruthy();
    },
  );

  it.each(["npm run cf:build", "npm run cf:preview", "npm run cf:deploy"])(
    "README names %s",
    (needle) => {
      expect(readme).toContain(needle);
    },
  );

  it("says the migrations have to be pushed to the hosted project", () => {
    // The likeliest way to ship a deploy that signs in and then breaks.
    expect(readme).toContain("supabase db push");
  });
});

describe("the production environment contract", () => {
  const contents = read(".env.production.example");

  it("declares both variables the app reads", () => {
    expect(contents).toContain("NEXT_PUBLIC_SUPABASE_URL");
    expect(contents).toContain("NEXT_PUBLIC_SUPABASE_ANON_KEY");
  });

  it("declares nothing that is not NEXT_PUBLIC_", () => {
    const declared = [...contents.matchAll(/^([A-Z0-9_]+)=/gm)].map((m) => m[1]);

    expect(declared.length).toBeGreaterThan(0);
    expect(declared.filter((name) => !name.startsWith("NEXT_PUBLIC_"))).toEqual([]);
  });

  it("ships both values blank", () => {
    // Committing a real project URL here would make the file a place secrets
    // get pasted by imitation. The blanks are the point.
    expect(contents).toMatch(/^NEXT_PUBLIC_SUPABASE_URL=\s*$/m);
    expect(contents).toMatch(/^NEXT_PUBLIC_SUPABASE_ANON_KEY=\s*$/m);
  });
});

describe("build output stays out of git", () => {
  const gitignore = read(".gitignore");

  it.each(["/.open-next/", "/.wrangler/"])("ignores %s", (needle) => {
    expect(gitignore).toContain(needle);
  });
});
