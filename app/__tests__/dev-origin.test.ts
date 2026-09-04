import { readFileSync } from "node:fs";
import { resolve } from "node:path";

/*
 * The host the README hands people has to be a host `next dev` will hydrate.
 *
 * Next 16 blocks its dev resources for any origin other than the one the server
 * announces (`localhost`), and `127.0.0.1` — the URL this project documents and
 * the one the end-to-end suite drives — is a different origin to that check.
 * The failure is silent from the browser's side: the page arrives server-
 * rendered and complete, React never hydrates, and "la entrada" reloads instead
 * of asking for the code. Nothing in the app's own tests can catch it, because
 * nothing in the app is wrong.
 *
 * So the coherence is asserted here instead: whatever host the README tells
 * people to open, `next.config.ts` has to allow.
 */
const ROOT = process.cwd();
const read = (name: string) => readFileSync(resolve(ROOT, name), "utf8");

describe("the documented dev URL is one that hydrates", () => {
  const readme = read("README.md");
  const config = read("next.config.ts");

  const hosts = [...readme.matchAll(/http:\/\/([\w.-]+):3000/g)].map(
    (match) => match[1],
  );

  it("the README names a dev host at port 3000", () => {
    expect(hosts.length).toBeGreaterThan(0);
  });

  it("every host it names is allowed by next.config.ts", () => {
    for (const host of new Set(hosts)) {
      // `localhost` is the origin the dev server announces, so it needs no
      // entry; anything else does.
      if (host === "localhost") continue;
      expect(config).toContain(`"${host}"`);
      expect(config).toMatch(/allowedDevOrigins/);
    }
  });
});
