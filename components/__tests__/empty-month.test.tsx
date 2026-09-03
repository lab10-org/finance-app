import { screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import BookScreen from "@/components/book/BookScreen";

import { SheetProbe, renderInBook } from "./render-book";

async function goToJuly(user: ReturnType<typeof renderInBook>["user"]) {
  await user.click(screen.getByRole("button", { name: /mes anterior/i }));
  await user.click(screen.getByRole("button", { name: /mes anterior/i }));
}

describe("an empty month (3.1, 3.2, 3.3, 3.4, 8.5)", () => {
  it("replaces the day list with the empty state", async () => {
    const { user } = renderInBook(<BookScreen />);
    await goToJuly(user);

    expect(screen.getByTestId("empty-month")).toBeInTheDocument();
    expect(screen.queryAllByTestId("day-strip")).toEqual([]);
  });

  it("heads the empty book with a zero count", async () => {
    const { user } = renderInBook(<BookScreen />);
    await goToJuly(user);

    const head = within(screen.getByTestId("empty-head"));
    expect(head.getByText("MOVIMIENTOS DEL MES")).toBeInTheDocument();
    expect(head.getByText("0")).toBeInTheDocument();
  });

  it("says what to do next", async () => {
    const { user } = renderInBook(<BookScreen />);
    await goToJuly(user);

    expect(screen.getByText("Aún no registras gastos este mes")).toBeInTheDocument();
    expect(
      screen.getByText("Anota el primero y tu libro se irá llenando día por día."),
    ).toBeInTheDocument();
    expect(screen.getAllByTestId("empty-rule")).toHaveLength(3);
  });

  it("offers the primary action with its promise", async () => {
    const { user } = renderInBook(<BookScreen />);
    await goToJuly(user);

    expect(screen.getByRole("button", { name: /registrar un gasto/i })).toBeInTheDocument();
    expect(screen.getByText("TOMA MENOS DE 10 SEGUNDOS")).toBeInTheDocument();
  });

  it("closes with the month and a zero total", async () => {
    const { user } = renderInBook(<BookScreen />);
    await goToJuly(user);

    const footer = within(screen.getByTestId("empty-footer"));
    expect(footer.getByText("JULIO 2026")).toBeInTheDocument();
    expect(footer.getByText("$0")).toBeInTheDocument();
  });

  it("hides the floating register button, which the primary action replaces", async () => {
    const { user } = renderInBook(<BookScreen />);
    await goToJuly(user);

    expect(screen.queryByRole("button", { name: /^registrar$/i })).toBeNull();
  });
});

describe("starting the month from empty (3.5)", () => {
  it("opens the sheet from the empty state's own action", async () => {
    const { user } = renderInBook(
      <>
        <BookScreen />
        <SheetProbe />
      </>,
    );
    await goToJuly(user);
    await user.click(screen.getByRole("button", { name: /registrar un gasto/i }));

    expect(screen.getByTestId("sheet-state")).toHaveTextContent("create");
  });
});
