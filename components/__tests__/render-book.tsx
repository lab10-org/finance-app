import { render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactElement } from "react";

import { seededBook } from "@/lib/domain/__tests__/fixtures";
import { BookProvider, useBook } from "@/state/book-store";

export const TODAY = "2026-09-03";

/** Renders a subtree inside a freshly seeded store pinned to a fixed date. */
export function renderInBook(ui: ReactElement, today: string = TODAY) {
  return {
    user: userEvent.setup(),
    ...render(<BookProvider today={today} expenses={seededBook()}>
        {ui}
      </BookProvider>),
  };
}

/** Renders the store's sheet state, so tests can assert what a tap opened. */
export function SheetProbe() {
  const { state } = useBook();
  return (
    <span data-testid="sheet-state">
      {state.sheet.mode === "edit" ? `edit:${state.sheet.expenseId}` : state.sheet.mode}
    </span>
  );
}
