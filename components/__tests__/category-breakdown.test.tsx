import { screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import BookScreen from "@/components/book/BookScreen";

import { renderInBook } from "./render-book";

describe("category breakdown (2.6, 2.7, 2.8)", () => {
  it("draws one segment per category present, largest share first", () => {
    renderInBook(<BookScreen />);
    const bar = screen.getByTestId("breakdown-bar");
    const segments = within(bar).getAllByTestId(/^breakdown-segment-/);

    expect(segments.map((s) => s.dataset.category)).toEqual([
      "mercado",
      "restaurantes",
      "suscripciones",
      "transporte",
    ]);
  });

  it("sizes each segment by its share and colours it by its category", () => {
    renderInBook(<BookScreen />);
    const first = screen.getByTestId("breakdown-segment-mercado");

    expect(first.style.flexGrow).toBe("111900");
    expect(first.style.background).toContain("--accent");
  });

  it("omits categories with nothing in them", () => {
    renderInBook(<BookScreen />);
    expect(screen.queryByTestId("breakdown-segment-otros")).toBeNull();
  });

  it("names the three biggest categories with a whole percentage", () => {
    renderInBook(<BookScreen />);
    const legend = screen.getByTestId("breakdown-legend");

    expect(within(legend).getByText("Mercado 45%")).toBeInTheDocument();
    expect(within(legend).getByText("Restaurantes 25%")).toBeInTheDocument();
    expect(within(legend).getByText("Suscripciones 18%")).toBeInTheDocument();
    expect(within(legend).queryByText(/Transporte/)).toBeNull();
  });
});

describe("an empty month (2.10)", () => {
  it("collapses the bar and hides the legend", async () => {
    const { user } = renderInBook(<BookScreen />);
    await user.click(screen.getByRole("button", { name: /mes anterior/i }));
    await user.click(screen.getByRole("button", { name: /mes anterior/i }));

    expect(screen.getByText("Julio 2026")).toBeInTheDocument();
    expect(screen.getByTestId("breakdown-empty")).toBeInTheDocument();
    expect(screen.queryByTestId("breakdown-legend")).toBeNull();
  });
});
