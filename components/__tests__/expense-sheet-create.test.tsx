import { screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import BookScreen from "@/components/book/BookScreen";

import { renderInBook } from "./render-book";

const sheet = () => within(screen.getByTestId("expense-sheet"));
const open = async (user: ReturnType<typeof renderInBook>["user"]) =>
  user.click(screen.getByRole("button", { name: /^registrar$/i }));

describe("opening the sheet (4.1, 4.2)", () => {
  it("rises over the book, which stays on screen", async () => {
    const { user } = renderInBook(<BookScreen />);
    await open(user);

    expect(screen.getByTestId("expense-sheet")).toBeInTheDocument();
    expect(screen.getByTestId("month-total")).toBeInTheDocument();
    expect(screen.getByText("HOY")).toBeInTheDocument();
  });

  it("puts the cursor in the amount field with a numeric keypad", async () => {
    const { user } = renderInBook(<BookScreen />);
    await open(user);

    const amount = sheet().getByLabelText(/monto/i);
    expect(amount).toHaveFocus();
    expect(amount).toHaveAttribute("inputmode", "numeric");
  });

  it("offers the five fixed categories", async () => {
    const { user } = renderInBook(<BookScreen />);
    await open(user);

    const chips = within(sheet().getByTestId("sheet-categories")).getAllByRole("button");
    expect(chips.map((c) => c.textContent)).toEqual([
      "Mercado",
      "Restaurantes",
      "Transporte",
      "Suscripciones",
      "Otros",
    ]);
  });

  it("treats description and date as optional, with today already filled in", async () => {
    const { user } = renderInBook(<BookScreen />);
    await open(user);

    expect(sheet().getByLabelText(/descripción/i)).toHaveValue("");
    expect(sheet().getByLabelText(/fecha/i)).toHaveValue("2026-09-03");
  });
});

describe("what the confirm action requires (4.7, 4.8)", () => {
  it("stays disabled until there is both an amount and a category", async () => {
    const { user } = renderInBook(<BookScreen />);
    await open(user);

    const confirm = sheet().getByRole("button", { name: /guardar/i });
    expect(confirm).toBeDisabled();

    await user.type(sheet().getByLabelText(/monto/i), "48500");
    expect(confirm).toBeDisabled();

    await user.click(sheet().getByRole("button", { name: "Mercado" }));
    expect(confirm).toBeEnabled();
  });
});

describe("typing an amount (9.5, 9.6, 4.10)", () => {
  it("groups thousands as the user types", async () => {
    const { user } = renderInBook(<BookScreen />);
    await open(user);

    await user.type(sheet().getByLabelText(/monto/i), "48500");
    expect(sheet().getByLabelText(/monto/i)).toHaveValue("48.500");
  });

  it("ignores digits past 999.999.999", async () => {
    const { user } = renderInBook(<BookScreen />);
    await open(user);

    await user.type(sheet().getByLabelText(/monto/i), "1234567890");
    expect(sheet().getByLabelText(/monto/i)).toHaveValue("123.456.789");
  });
});

describe("confirming (4.6, 2.13)", () => {
  it("closes the sheet, lands the row under HOY and moves the total", async () => {
    const { user } = renderInBook(<BookScreen />);
    await open(user);

    await user.type(sheet().getByLabelText(/monto/i), "48500");
    await user.click(sheet().getByRole("button", { name: "Mercado" }));
    await user.type(sheet().getByLabelText(/descripción/i), "Éxito Envigado");
    await user.click(sheet().getByRole("button", { name: /guardar/i }));

    expect(screen.queryByTestId("expense-sheet")).toBeNull();

    const today = within(screen.getByTestId("day-2026-09-03"));
    expect(today.getAllByTestId("row-title")[0]).toHaveTextContent("Éxito Envigado");
    expect(screen.getByTestId("month-total")).toHaveTextContent("$297.400");
    expect(within(screen.getAllByTestId("day-strip")[0]).getByTestId("day-subtotal"))
      .toHaveTextContent("$127.900");
  });
});

describe("registering from a past month (4.5, 3.5)", () => {
  it("defaults the date to the first day of the month being viewed", async () => {
    const { user } = renderInBook(<BookScreen />);
    await user.click(screen.getByRole("button", { name: /mes anterior/i }));
    await user.click(screen.getByRole("button", { name: /mes anterior/i }));
    await user.click(screen.getByRole("button", { name: /registrar un gasto/i }));

    expect(sheet().getByLabelText(/fecha/i)).toHaveValue("2026-07-01");

    await user.type(sheet().getByLabelText(/monto/i), "30000");
    await user.click(sheet().getByRole("button", { name: "Otros" }));
    await user.click(sheet().getByRole("button", { name: /guardar/i }));

    expect(screen.queryByTestId("empty-month")).toBeNull();
    expect(screen.getByText("1 DE JULIO")).toBeInTheDocument();
  });
});

describe("dismissing without confirming (4.9)", () => {
  it("leaves the book exactly as it was", async () => {
    const { user } = renderInBook(<BookScreen />);
    await open(user);

    await user.type(sheet().getByLabelText(/monto/i), "99000");
    await user.click(sheet().getByRole("button", { name: "Mercado" }));
    await user.click(sheet().getByRole("button", { name: /cerrar/i }));

    expect(screen.queryByTestId("expense-sheet")).toBeNull();
    expect(screen.getByTestId("month-total")).toHaveTextContent("$248.900");
  });
});
