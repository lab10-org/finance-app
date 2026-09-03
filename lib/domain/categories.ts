import type { Category, CategoryId } from "./types";

/**
 * The five fixed categories, in the order the design uses to break ties when
 * two categories spend the same amount (2.12). Colour is bound to a category's
 * identity, not to its rank in the breakdown bar.
 */
export const CATEGORIES: readonly Category[] = [
  { id: "mercado", label: "Mercado", glyph: "shopping-basket", colorToken: "--accent" },
  { id: "restaurantes", label: "Restaurantes", glyph: "utensils", colorToken: "--accent-2" },
  { id: "transporte", label: "Transporte", glyph: "bus", colorToken: "--accent-3" },
  { id: "suscripciones", label: "Suscripciones", glyph: "repeat", colorToken: "--accent-4" },
  { id: "otros", label: "Otros", glyph: "more-horizontal", colorToken: "--accent-5" },
] as const;

export const CATEGORY_ORDER: readonly CategoryId[] = CATEGORIES.map((c) => c.id);

export const CATEGORY_BY_ID = Object.fromEntries(
  CATEGORIES.map((c) => [c.id, c]),
) as Record<CategoryId, Category>;

export function categoryRank(id: CategoryId): number {
  return CATEGORY_ORDER.indexOf(id);
}
