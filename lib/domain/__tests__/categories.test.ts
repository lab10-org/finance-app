import { describe, expect, it } from "vitest";

import { CATEGORIES, CATEGORY_BY_ID, CATEGORY_ORDER } from "@/lib/domain/categories";

describe("category table (4.3, 2.12)", () => {
  it("has exactly the five fixed categories, in the tie-breaking order", () => {
    expect(CATEGORY_ORDER).toEqual([
      "mercado",
      "restaurantes",
      "transporte",
      "suscripciones",
      "otros",
    ]);
    expect(CATEGORIES).toHaveLength(5);
  });

  it("carries the Spanish label, the lucide glyph and the colour token of each", () => {
    expect(CATEGORIES).toEqual([
      { id: "mercado", label: "Mercado", glyph: "shopping-basket", colorToken: "--accent" },
      { id: "restaurantes", label: "Restaurantes", glyph: "utensils", colorToken: "--accent-2" },
      { id: "transporte", label: "Transporte", glyph: "bus", colorToken: "--accent-3" },
      { id: "suscripciones", label: "Suscripciones", glyph: "repeat", colorToken: "--accent-4" },
      { id: "otros", label: "Otros", glyph: "more-horizontal", colorToken: "--accent-5" },
    ]);
  });

  it("indexes categories by id", () => {
    expect(CATEGORY_BY_ID.mercado.label).toBe("Mercado");
    expect(CATEGORY_BY_ID.otros.colorToken).toBe("--accent-5");
  });
});
