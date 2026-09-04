import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

import {
  CODE_LENGTH,
  CODE_TTL_SECONDS,
  RESEND_COOLDOWN_SECONDS,
} from "@/lib/auth/config";

/*
 * The UI states these numbers out loud — "espera 60 segundos", "un código de 6
 * dígitos" — so a drift between the constants and what the server enforces
 * turns the screen into a liar. A one-test TOML dependency is not worth it;
 * this reads the handful of keys the feature sets deliberately.
 */
const CONFIG_PATH = resolve(process.cwd(), "supabase/config.toml");

/** The raw `key = value` pairs of one `[section]`, comments stripped. */
function section(toml: string, name: string): Record<string, string> {
  const lines = toml.split("\n");
  const start = lines.findIndex((line) => line.trim() === `[${name}]`);
  if (start === -1) return {};

  const values: Record<string, string> = {};
  for (const line of lines.slice(start + 1)) {
    const trimmed = line.trim();
    if (trimmed.startsWith("[")) break;
    const match = /^([A-Za-z0-9_]+)\s*=\s*(.+?)\s*(?:#.*)?$/.exec(trimmed);
    if (match) values[match[1]] = match[2].trim();
  }
  return values;
}

function quoted(value: string | undefined): string | undefined {
  return value?.replace(/^"(.*)"$/, "$1");
}

describe("supabase/config.toml matches the constants the UI quotes", () => {
  const toml = existsSync(CONFIG_PATH) ? readFileSync(CONFIG_PATH, "utf8") : "";

  it("is committed to the repository (1.1)", () => {
    expect(existsSync(CONFIG_PATH)).toBe(true);
  });

  it("sends a code of CODE_LENGTH digits (3.2)", () => {
    expect(section(toml, "auth.email").otp_length).toBe(String(CODE_LENGTH));
  });

  it("expires the code after CODE_TTL_SECONDS (3.5)", () => {
    expect(section(toml, "auth.email").otp_expiry).toBe(String(CODE_TTL_SECONDS));
  });

  it("throttles sends at RESEND_COOLDOWN_SECONDS (2.7, 3.6)", () => {
    expect(quoted(section(toml, "auth.email").max_frequency)).toBe(
      `${RESEND_COOLDOWN_SECONDS}s`,
    );
  });

  it("lets a first sign-in create the account (2.5)", () => {
    expect(section(toml, "auth").enable_signup).toBe("true");
    expect(section(toml, "auth.email").enable_signup).toBe("true");
  });

  it("does not demand a separate email confirmation (2.5)", () => {
    expect(section(toml, "auth.email").enable_confirmations).toBe("false");
  });

  it("catches outgoing mail locally on port 54324 (1.3)", () => {
    const smtp = section(toml, "local_smtp");
    expect(smtp.enabled).toBe("true");
    expect(smtp.port).toBe("54324");
  });

  it("points the magic-link template at a committed file that prints the code", () => {
    const template = section(toml, "auth.email.template.magic_link");
    const contentPath = quoted(template.content_path);
    expect(contentPath).toBeDefined();

    const resolved = resolve(process.cwd(), contentPath as string);
    expect(existsSync(resolved)).toBe(true);

    // Comments are stripped first: what matters is what GoTrue renders, and
    // the template documents in prose why the link variable is gone.
    const html = readFileSync(resolved, "utf8").replace(/<!--[\s\S]*?-->/g, "");
    // The code, not a link: this is the single line that turns Supabase's
    // magic link into an OTP (see design.md, "Data models").
    expect(html).toContain("{{ .Token }}");
    expect(html).not.toContain("{{ .ConfirmationURL }}");
  });
});
