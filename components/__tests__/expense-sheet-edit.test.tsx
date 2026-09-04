import { fireEvent, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import BookScreen from "@/components/book/BookScreen";
import { seededBook } from "@/lib/domain/__tests__/fixtures";

const SEEDED = seededBook();

import { renderInBook } from "./render-book";

const sheet = () => within(screen.getByTestId("expense-sheet"));
const target = SEEDED.find(
  (e) => e.description === "Crepes & Waffles" && e.date === "2026-09-02",
)!;

const openTarget = async (user: ReturnType<typeof renderInBook>["user"]) =>
  user.click(screen.getByTestId(`row-${target.id}`));

describe("opening an expense (5.1, 5.2)", () => {
  it("pre-fills the sheet with everything the expense already has", async () => {
    const { user } = renderInBook(<BookScreen />);
    await openTarget(user);

    expect(sheet().getByLabelText(/monto/i)).toHaveValue("42.300");
    expect(sheet().getByRole("button", { name: "Restaurantes" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(sheet().getByLabelText(/descripción/i)).toHaveValue("Crepes & Waffles");
    expect(sheet().getByLabelText(/fecha/i)).toHaveValue("2026-09-02");
  });

  it("offers Eliminar, which registration mode does not", async () => {
    const { user } = renderInBook(<BookScreen />);
    await openTarget(user);
    expect(sheet().getByRole("button", { name: /eliminar/i })).toBeInTheDocument();

    await user.click(sheet().getByRole("button", { name: /cerrar/i }));
    await user.click(screen.getByRole("button", { name: /^registrar$/i }));
    expect(sheet().queryByRole("button", { name: /eliminar/i })).toBeNull();
  });
});

describe("confirming an edit (5.3)", () => {
  it("updates the row and every figure in place", async () => {
    const { user } = renderInBook(<BookScreen />);
    await openTarget(user);

    await user.clear(sheet().getByLabelText(/monto/i));
    await user.type(sheet().getByLabelText(/monto/i), "60000");
    await user.click(sheet().getByRole("button", { name: "Mercado" }));
    await user.click(sheet().getByRole("button", { name: /guardar/i }));

    const row = within(screen.getByTestId(`row-${target.id}`));
    expect(row.getByTestId("row-amount")).toHaveTextContent("$60.000");
    expect(row.getByTestId("row-category")).toHaveTextContent("Mercado");
    expect(screen.getByTestId("month-total")).toHaveTextContent("$266.600");
  });
});

describe("moving an expense in time (5.4, 5.5)", () => {
  it("re-groups it when the new day is in the same month", async () => {
    const { user } = renderInBook(<BookScreen />);
    await openTarget(user);

    fireEvent.change(sheet().getByLabelText(/fecha/i), { target: { value: "2026-09-01" } });
    await user.click(sheet().getByRole("button", { name: /guardar/i }));

    expect(
      within(screen.getByTestId("day-2026-09-01")).getByTestId(`row-${target.id}`),
    ).toBeInTheDocument();
    expect(
      within(screen.getByTestId("day-2026-09-02")).queryByTestId(`row-${target.id}`),
    ).toBeNull();
  });

  it("takes the book with it when the new day is in another month", async () => {
    const { user } = renderInBook(<BookScreen />);
    await openTarget(user);

    fireEvent.change(sheet().getByLabelText(/fecha/i), { target: { value: "2026-08-28" } });
    await user.click(sheet().getByRole("button", { name: /guardar/i }));

    expect(screen.getByText("Agosto 2026")).toBeInTheDocument();
    expect(screen.getByTestId(`row-${target.id}`)).toBeInTheDocument();
  });
});

describe("dismissing an edit (5.6)", () => {
  it("leaves the expense exactly as it was", async () => {
    const { user } = renderInBook(<BookScreen />);
    await openTarget(user);

    await user.clear(sheet().getByLabelText(/monto/i));
    await user.type(sheet().getByLabelText(/monto/i), "1");
    await user.click(sheet().getByRole("button", { name: /cerrar/i }));

    expect(
      within(screen.getByTestId(`row-${target.id}`)).getByTestId("row-amount"),
    ).toHaveTextContent("$42.300");
    expect(screen.getByTestId("month-total")).toHaveTextContent("$248.900");
  });
});
