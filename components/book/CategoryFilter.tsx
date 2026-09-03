"use client";

import { useEffect, useState } from "react";

import { CATEGORY_BY_ID } from "@/lib/domain/categories";
import type { CategoryFilterValue, CategoryId, MonthKey } from "@/lib/domain/types";

import styles from "./CategoryFilter.module.css";

/** Above this many chips, the surplus collapses behind a "+N" (7.3). */
const VISIBLE_CHIPS = 4;

export interface CategoryFilterProps {
  available: CategoryId[];
  selected: CategoryFilterValue;
  month: MonthKey;
  onSelect: (filter: CategoryFilterValue) => void;
}

export function CategoryFilter({
  available,
  selected,
  month,
  onSelect,
}: CategoryFilterProps) {
  /*
   * Expansion is view state with no effect on any figure, so it stays local —
   * putting it in the store would only add an action nobody reads. It does
   * collapse again when the month changes, along with everything else.
   */
  const [expanded, setExpanded] = useState(false);
  useEffect(() => setExpanded(false), [month]);

  const chips: { value: CategoryFilterValue; label: string }[] = [
    { value: "todas", label: "Todas" },
    ...available.map((id) => ({ value: id, label: CATEGORY_BY_ID[id].label })),
  ];

  const collapsed = !expanded && chips.length > VISIBLE_CHIPS;
  const shown = collapsed ? chips.slice(0, VISIBLE_CHIPS) : chips;
  const hidden = chips.length - shown.length;

  return (
    <div className={styles.filter} data-testid="category-filter">
      {shown.map((chip) => {
        const isSelected = chip.value === selected;
        return (
          <button
            key={chip.value}
            type="button"
            aria-pressed={isSelected}
            className={`${styles.chip} ${isSelected ? styles.selected : ""}`}
            onClick={() => onSelect(chip.value)}
          >
            <span className={styles.label}>{chip.label}</span>
            {isSelected && <span className={styles.underline} />}
          </button>
        );
      })}
      {collapsed && (
        <button type="button" className={styles.chip} onClick={() => setExpanded(true)}>
          <span className={styles.label}>{`+${hidden}`}</span>
        </button>
      )}
    </div>
  );
}
