import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import BookScreen from "@/components/book/BookScreen";

import { renderInBook } from "./render-book";

describe("month header (8.1, 8.2, 8.3, 8.4, 8.7)", () => {
  it("titles the viewed month in Spanish", () => {
    renderInBook(<BookScreen />);
    expect(screen.getByText("Septiembre 2026")).toBeInTheDocument();
  });

  it("cannot move past the month containing today", () => {
    renderInBook(<BookScreen />);
    expect(screen.getByRole("button", { name: /mes siguiente/i })).toBeDisabled();
  });

  it("steps back a month, which re-enables moving forward", async () => {
    const { user } = renderInBook(<BookScreen />);
    await user.click(screen.getByRole("button", { name: /mes anterior/i }));

    expect(screen.getByText("Agosto 2026")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /mes siguiente/i })).toBeEnabled();
  });

  it("renders no search control, because search is out of scope", () => {
    renderInBook(<BookScreen />);
    expect(screen.queryByRole("button", { name: /buscar/i })).toBeNull();
  });
});

describe("month total and comparison (2.1, 2.5, 2.11)", () => {
  it("shows the month total under TOTAL GASTADO", () => {
    renderInBook(<BookScreen />);
    expect(screen.getByText("TOTAL GASTADO")).toBeInTheDocument();
    expect(screen.getByTestId("month-total")).toHaveTextContent("$248.900");
  });

  it("compares against the previous month in words", () => {
    renderInBook(<BookScreen />);
    expect(screen.getByText("82,4% menos que en agosto")).toBeInTheDocument();
  });

  it("hides the comparison when the previous month is empty", async () => {
    const { user } = renderInBook(<BookScreen />);
    await user.click(screen.getByRole("button", { name: /mes anterior/i }));

    expect(screen.getByText("Agosto 2026")).toBeInTheDocument();
    expect(screen.queryByTestId("month-comparison")).toBeNull();
  });
});
