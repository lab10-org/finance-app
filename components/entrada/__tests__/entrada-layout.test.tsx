import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { CODE_LENGTH, RESEND_COOLDOWN_SECONDS } from "@/lib/auth/config";

import { renderEntrada } from "./fake-auth";

const CSS = readFileSync(
  resolve(process.cwd(), "components/entrada/Entrada.module.css"),
  "utf8",
);

/** The declarations of one class, as written. */
function rule(selector: string): string {
  const match = new RegExp(`\\.${selector}\\s*\\{([^}]*)\\}`).exec(CSS);
  return match ? match[1] : "";
}

describe("the same column as the book (7.1)", () => {
  it("caps the column at 390px and centres it", () => {
    const column = rule("column");

    expect(column).toMatch(/max-width:\s*390px/);
    expect(column).toMatch(/margin-inline:\s*auto/);
  });

  it("pads the screen with the token, not a number", () => {
    expect(rule("column")).toMatch(/padding:\s*var\(--screen-pad\)/);
  });
});

describe("only the token table (7.2, 7.3)", () => {
  it("writes no raw colour of its own", () => {
    // Also enforced globally by app/__tests__/no-stray-colours.test.ts, which
    // walks this directory; asserted here too so the failure names this file.
    expect(CSS.match(/#[0-9a-fA-F]{3,8}\b/g)).toBeNull();
    expect(CSS.match(/\b(rgba?|hsla?)\(/g)).toBeNull();
  });

  it("sets every colour from a token", () => {
    const colours = CSS.match(/(?:^|\s)(?:color|background):\s*([^;]+);/gm) ?? [];

    expect(colours.length).toBeGreaterThan(0);
    for (const declaration of colours) {
      expect(declaration).toMatch(/var\(--/);
    }
  });

  it("renders the code in the numeric font", () => {
    expect(rule("num")).toMatch(/font-family:\s*var\(--font-num\)/);
  });
});

describe("every word is Spanish (7.4)", () => {
  /** The whole copy table of "la entrada". Nothing else may be on screen. */
  const COPY = new Set([
    "Tu libro de gastos",
    "Entra con tu correo. No necesitas contraseña.",
    "Escribe el código para entrar.",
    "Correo",
    "Enviar código",
    "Enviando…",
    "Código",
    "Entrar",
    "Entrando…",
    "Cambiar correo",
    "Enviar otro código",
    `Puedes pedir otro en ${RESEND_COOLDOWN_SECONDS} s`,
    `Te enviamos un código de ${CODE_LENGTH} dígitos a juanse@lab10.ai.`,
  ]);

  /** Visible text of every leaf element that carries words. */
  function visibleStrings(container: HTMLElement): string[] {
    return [...container.querySelectorAll("h1, p, label, button")]
      .map((node) => node.textContent?.replace(/\s+/g, " ").trim() ?? "")
      .filter(Boolean);
  }

  it("shows nothing but the copy table on the email step", () => {
    const { container } = renderEntrada();

    for (const text of visibleStrings(container)) {
      expect(COPY).toContain(text);
    }
  });

  it("shows nothing but the copy table on the code step", async () => {
    const user = userEvent.setup();
    const { container } = renderEntrada();

    await user.type(screen.getByLabelText("Correo"), "juanse@lab10.ai");
    await user.click(screen.getByRole("button", { name: "Enviar código" }));
    await screen.findByLabelText("Código");

    for (const text of visibleStrings(container)) {
      expect(COPY).toContain(text);
    }
  });
});
