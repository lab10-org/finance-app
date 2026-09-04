import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import BookScreen from "@/components/book/BookScreen";
import { seededBook } from "@/lib/domain/__tests__/fixtures";

const SEEDED = seededBook();

import { SheetProbe, renderInBook } from "./render-book";

describe("jornadas (1.2, 1.3, 1.4, 1.5)", () => {
  it("groups the month by day, most recent first, with each day's subtotal", () => {
    renderInBook(<BookScreen />);
    const strips = screen.getAllByTestId("day-strip");

    expect(strips.map((s) => within(s).getByTestId("day-label").textContent)).toEqual([
      "HOY",
      "AYER",
      "1 DE SEPTIEMBRE",
    ]);
    expect(strips.map((s) => within(s).getByTestId("day-subtotal").textContent)).toEqual([
      "$79.400",
      "$89.200",
      "$80.300",
    ]);
  });

  it("orders the expenses of a day most recently registered first", () => {
    renderInBook(<BookScreen />);
    const today = screen.getByTestId("day-2026-09-03");
    const titles = within(today)
      .getAllByTestId("row-title")
      .map((t) => t.textContent);

    expect(titles).toEqual(["Éxito Poblado", "Uber a la oficina", "Café Velvet"]);
  });
});

describe("an expense row (1.6, 1.7, 1.8)", () => {
  it("shows the glyph, the title, the category and the amount", () => {
    renderInBook(<BookScreen />);
    const row = screen.getByTestId("row-" + SEEDED.find((e) => e.description === "Café Velvet" && e.date === "2026-09-03")!.id);

    expect(within(row).getByTestId("row-glyph")).toBeInTheDocument();
    expect(within(row).getByTestId("row-title")).toHaveTextContent("Café Velvet");
    expect(within(row).getByTestId("row-category")).toHaveTextContent("Restaurantes");
    expect(within(row).getByTestId("row-amount")).toHaveTextContent("$18.900");
  });

  it("falls back to the category name when there is no description", async () => {
    const { user } = renderInBook(<BookScreen />);
    await user.click(screen.getByRole("button", { name: /mes anterior/i }));

    const undescribed = SEEDED.find((e) => e.description === undefined)!;
    const row = screen.getByTestId(`row-${undescribed.id}`);

    expect(within(row).getByTestId("row-title")).toHaveTextContent("Otros");
    expect(within(row).getByTestId("row-category")).toHaveTextContent("Otros");
  });
});

describe("the closing row (1.9)", () => {
  it("names the month and repeats its total", () => {
    renderInBook(<BookScreen />);
    expect(screen.getByText("TOTAL DE SEPTIEMBRE")).toBeInTheDocument();
    expect(screen.getByTestId("book-footer-total")).toHaveTextContent("$248.900");
  });
});

describe("tapping a row (5.1)", () => {
  it("opens the sheet in edit mode on that expense", async () => {
    const { user } = renderInBook(
      <>
        <BookScreen />
        <SheetProbe />
      </>,
    );
    const target = SEEDED.find(
      (e) => e.description === "Netflix" && e.date === "2026-09-02",
    )!;

    expect(screen.getByTestId("sheet-state")).toHaveTextContent("closed");
    await user.click(screen.getByTestId(`row-${target.id}`));
    expect(screen.getByTestId("sheet-state")).toHaveTextContent(`edit:${target.id}`);
  });
});

describe("staying inside 390px (1.10)", () => {
  it("truncates a long description instead of pushing the amount out of the column", () => {
    const css = readFileSync(resolve(process.cwd(), "components/book/ExpenseRow.module.css"), "utf8");
    expect(css).toMatch(/min-width:\s*0/);
    expect(css).toMatch(/text-overflow:\s*ellipsis/);
  });

  it("keeps the 1px rule between rows visible", () => {
    // An inline <span> ignores height, so the hairline vanished in the browser
    // while every test still passed.
    const css = readFileSync(resolve(process.cwd(), "components/book/ExpenseRow.module.css"), "utf8");
    expect(css).toMatch(/\.hairline\s*\{[^}]*display:\s*block/);
  });
});

describe("the register button (4.1)", () => {
  it("opens the sheet in create mode", async () => {
    const { user } = renderInBook(
      <>
        <BookScreen />
        <SheetProbe />
      </>,
    );
    await user.click(screen.getByRole("button", { name: /^registrar$/i }));
    expect(screen.getByTestId("sheet-state")).toHaveTextContent("create");
  });
});
