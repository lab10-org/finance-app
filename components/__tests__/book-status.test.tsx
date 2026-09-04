import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import BookScreen from "@/components/book/BookScreen";
import { seededBook } from "@/lib/domain/__tests__/fixtures";
import { createFakeRepository } from "@/lib/expenses/__tests__/fake-repository";
import { BookProvider } from "@/state/book-store";

import { initialBook } from "./render-book";

const TODAY = "2026-09-03";

function renderBook(over: Parameters<typeof initialBook>[0] = {}, repo = createFakeRepository(seededBook())) {
  return {
    user: userEvent.setup(),
    repository: repo,
    ...render(
      <BookProvider initial={initialBook({ today: TODAY, ...over })} repository={repo}>
        <BookScreen />
      </BookProvider>,
    ),
  };
}

describe("a month that could not be read (3.6)", () => {
  it("says so instead of showing an empty book", () => {
    renderBook({ expenses: [], error: true });

    expect(screen.getByTestId("month-error")).toBeInTheDocument();
    // The dangerous alternative: a book that reads as "you spent nothing".
    expect(screen.queryByText("Aún no registras gastos este mes")).not.toBeInTheDocument();
  });

  it("names the month it could not load", () => {
    renderBook({ expenses: [], error: true });

    expect(screen.getByTestId("month-error")).toHaveTextContent(/Septiembre 2026/);
  });

  it("reassures that the expenses are not lost", () => {
    renderBook({ expenses: [], error: true });

    expect(screen.getByText(/están guardados/)).toBeInTheDocument();
  });

  it("offers a retry that re-reads the window (4.4)", async () => {
    const repo = createFakeRepository(seededBook());
    const spy = vi.spyOn(repo, "readWindow");
    const { user } = renderBook({ expenses: [], error: true }, repo);

    await user.click(screen.getByRole("button", { name: "Reintentar" }));

    expect(spy).toHaveBeenCalledWith("2026-09");
  });

  it("shows the book once the retry succeeds", async () => {
    const repo = createFakeRepository(seededBook());
    const { user } = renderBook({ expenses: [], error: true }, repo);

    await user.click(screen.getByRole("button", { name: "Reintentar" }));

    expect(screen.queryByTestId("month-error")).not.toBeInTheDocument();
    expect(screen.getByText("TOTAL GASTADO")).toBeInTheDocument();
  });
});

describe("an empty month is not an error (3.5)", () => {
  it("shows the empty state, not the failure and not a spinner", () => {
    renderBook({ expenses: [], error: false });

    expect(screen.queryByTestId("month-error")).not.toBeInTheDocument();
    expect(screen.queryByTestId("month-loading")).not.toBeInTheDocument();
    expect(screen.getByText("Aún no registras gastos este mes")).toBeInTheDocument();
  });
});

describe("a month still arriving (4.2)", () => {
  it("shows the loading state rather than incomplete figures", async () => {
    const repo = createFakeRepository(seededBook());
    repo.defer(["read"]);
    const { user } = renderBook({}, repo);

    // Navigating two months back lands on a window that was never read.
    await user.click(screen.getByRole("button", { name: /mes anterior/i }));
    await user.click(screen.getByRole("button", { name: /mes anterior/i }));

    expect(screen.getByTestId("month-loading")).toBeInTheDocument();

    /*
     * Y el encabezado calla mientras tanto. Sin esto la prueba pasaba con la
     * pantalla diciendo "TOTAL GASTADO $0" en tipografía de titular sobre un mes
     * que todavía se estaba leyendo: un panel de "cargando" debajo no arregla
     * una cifra que arriba se lee como definitiva, que es lo que 4.2 prohíbe.
     */
    expect(screen.getByTestId("month-total")).toHaveTextContent("—");
    expect(screen.queryByTestId("month-comparison")).not.toBeInTheDocument();
    for (const metrica of ["previous", "average", "top"]) {
      expect(within(screen.getByTestId(`metric-${metrica}`)).getByTestId("metric-value"))
        .toHaveTextContent("—");
    }

    await repo.release();
  });
});

describe("un mes que no se pudo leer tampoco declara cifras (3.6)", () => {
  it("no dice que el gasto del mes fue cero", () => {
    renderBook({ expenses: [], error: true });

    // El panel de error ya lo cubre la prueba de arriba; lo que se comprueba
    // acá es que el encabezado no contradiga al panel afirmando $0.
    expect(screen.getByTestId("month-total")).toHaveTextContent("—");
    expect(
      within(screen.getByTestId("metric-previous")).getByTestId("metric-value"),
    ).toHaveTextContent("—");
  });
});

describe("a failed write (5.4, 5.5, 6.9, 7.5)", () => {
  it("tells the user and offers a retry", async () => {
    const repo = createFakeRepository(seededBook());
    const { user } = renderBook({}, repo);

    repo.failNext("No se pudo guardar el gasto", ["create"]);

    await user.click(screen.getByRole("button", { name: /registrar/i }));

    // Scoped to the sheet: the category filter behind it has the same names.
    const sheet = screen.getByRole("dialog");
    await user.type(within(sheet).getByLabelText(/monto/i), "25000");
    await user.click(within(sheet).getByRole("button", { name: /mercado/i }));
    await user.click(within(sheet).getByRole("button", { name: /^guardar$/i }));

    expect(await screen.findByTestId("write-failure")).toBeInTheDocument();
    expect(screen.getByText("No se pudo guardar el gasto")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Reintentar" })).toBeInTheDocument();
  });

  it("can be dismissed", async () => {
    const repo = createFakeRepository(seededBook());
    const { user } = renderBook({}, repo);

    repo.failNext("offline", ["create"]);

    await user.click(screen.getByRole("button", { name: /registrar/i }));

    // Scoped to the sheet: the category filter behind it has the same names.
    const sheet = screen.getByRole("dialog");
    await user.type(within(sheet).getByLabelText(/monto/i), "25000");
    await user.click(within(sheet).getByRole("button", { name: /mercado/i }));
    await user.click(within(sheet).getByRole("button", { name: /^guardar$/i }));

    await screen.findByTestId("write-failure");
    await user.click(screen.getByRole("button", { name: /descartar el aviso/i }));

    expect(screen.queryByTestId("write-failure")).not.toBeInTheDocument();
  });
});
