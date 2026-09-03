import { screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import BookScreen from "@/components/book/BookScreen";

import { renderInBook } from "./render-book";

const metric = (label: string) => within(screen.getByTestId(`metric-${label}`));

describe("summary row (2.2, 2.3, 2.4)", () => {
  it("shows the previous month's total with its name", () => {
    renderInBook(<BookScreen />);
    expect(screen.getByText("MES ANTERIOR")).toBeInTheDocument();
    expect(metric("previous").getByTestId("metric-value")).toHaveTextContent("$1.412.300");
    expect(metric("previous").getByTestId("metric-note")).toHaveTextContent("agosto");
  });

  it("divides the month total by the days elapsed so far", () => {
    renderInBook(<BookScreen />);
    expect(screen.getByText("PROMEDIO DIARIO")).toBeInTheDocument();
    expect(metric("average").getByTestId("metric-value")).toHaveTextContent("$82.967");
    expect(metric("average").getByTestId("metric-note")).toHaveTextContent("3 días");
  });

  it("names the biggest category and what it cost", () => {
    renderInBook(<BookScreen />);
    expect(screen.getByText("MÁS GASTADO")).toBeInTheDocument();
    expect(metric("top").getByTestId("metric-value")).toHaveTextContent("$111.900");
    expect(metric("top").getByTestId("metric-note")).toHaveTextContent("Mercado");
  });
});

describe("summary row with no data (2.9)", () => {
  it("shows an em dash and 'sin datos' for the two derived metrics", async () => {
    const { user } = renderInBook(<BookScreen />);
    await user.click(screen.getByRole("button", { name: /mes anterior/i }));
    await user.click(screen.getByRole("button", { name: /mes anterior/i }));

    expect(screen.getByText("Julio 2026")).toBeInTheDocument();
    for (const name of ["average", "top"]) {
      expect(metric(name).getByTestId("metric-value")).toHaveTextContent("—");
      expect(metric(name).getByTestId("metric-note")).toHaveTextContent("sin datos");
    }
  });

  it("still shows the previous month, even when it is zero", async () => {
    const { user } = renderInBook(<BookScreen />);
    await user.click(screen.getByRole("button", { name: /mes anterior/i }));
    await user.click(screen.getByRole("button", { name: /mes anterior/i }));

    expect(metric("previous").getByTestId("metric-value")).toHaveTextContent("$0");
    expect(metric("previous").getByTestId("metric-note")).toHaveTextContent("junio");
  });
});
