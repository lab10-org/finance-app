"use client";

import { Bus, MoreHorizontal, Repeat, ShoppingBasket, Utensils } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import type { CategoryId } from "@/lib/domain/types";

/** The one place a lucide glyph name from the domain becomes a component. */
const GLYPHS: Record<CategoryId, LucideIcon> = {
  mercado: ShoppingBasket,
  restaurantes: Utensils,
  transporte: Bus,
  suscripciones: Repeat,
  otros: MoreHorizontal,
};

export function CategoryGlyph({
  categoryId,
  size = 16,
  ...rest
}: {
  categoryId: CategoryId;
  size?: number;
} & Record<string, unknown>) {
  const Glyph = GLYPHS[categoryId];
  return <Glyph size={size} strokeWidth={1.75} aria-hidden {...rest} />;
}
