import { screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import BookScreen from "@/components/book/BookScreen";

import { renderInBook } from "./render-book";

const chips = () => within(screen.getByTestId("category-filter"));

describe("the chip row (7.1, 7.2, 7.3)", () => {
  it("offers Todas plus only the categories present this month", () => {
    renderInBook(<BookScreen />);
    const labels = chips()
      .getAllByRole("button")
      .map((b) => b.textContent);

    expect(labels[0]).toBe("Todas");
    expect(labels).not.toContain("Otros");
  });

  it("starts with Todas selected", () => {
    renderInBook(<BookScreen />);
    expect(chips().getByRole("button", { name: "Todas" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  it("collapses more than four chips behind a +N, which expands in place", async () => {
    const { user } = renderInBook(<BookScreen />);
    expect(chips().getByRole("button", { name: "+1" })).toBeInTheDocument();
    expect(chips().queryByRole("button", { name: "Suscripciones" })).toBeNull();

    await user.click(chips().getByRole("button", { name: "+1" }));

    expect(chips().getByRole("button", { name: "Suscripciones" })).toBeInTheDocument();
    expect(chips().queryByRole("button", { name: "+1" })).toBeNull();
  });
});

describe("what the filter changes (7.4) and what it does not (7.5)", () => {
  it("recomputes the month total from the selected category alone", async () => {
    const { user } = renderInBook(<BookScreen />);
    expect(screen.getByTestId("month-total")).toHaveTextContent("$248.900");

    await user.click(chips().getByRole("button", { name: "Mercado" }));

    expect(screen.getByTestId("month-total")).toHaveTextContent("$111.900");
    expect(chips().getByRole("button", { name: "Mercado" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  it("leaves MÁS GASTADO describing the whole month", async () => {
    const { user } = renderInBook(<BookScreen />);
    await user.click(chips().getByRole("button", { name: "Transporte" }));

    const top = within(screen.getByTestId("metric-top"));
    expect(top.getByTestId("metric-value")).toHaveTextContent("$111.900");
    expect(top.getByTestId("metric-note")).toHaveTextContent("Mercado");
  });
});

describe("changing month (7.6)", () => {
  it("resets the filter to Todas", async () => {
    const { user } = renderInBook(<BookScreen />);
    await user.click(chips().getByRole("button", { name: "Mercado" }));
    await user.click(screen.getByRole("button", { name: /mes anterior/i }));

    expect(chips().getByRole("button", { name: "Todas" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });
});
