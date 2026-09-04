"use client";

import { CATEGORY_BY_ID } from "@/lib/domain/categories";
import type { Expense } from "@/lib/domain/types";
import { formatAmount } from "@/lib/format";

import { CategoryGlyph } from "./CategoryGlyph";
import styles from "./ExpenseRow.module.css";

export interface ExpenseRowProps {
  expense: Expense;
  onSelect: (id: string) => void;
}

export function ExpenseRow({ expense, onSelect }: ExpenseRowProps) {
  const category = CATEGORY_BY_ID[expense.categoryId];
  // No description falls back to the category name (1.7, 1.8).
  const title = expense.description || category.label;

  return (
    <button
      type="button"
      className={styles.row}
      data-testid={`row-${expense.id}`}
      onClick={() => onSelect(expense.id)}
    >
      <span className={styles.glyph} data-testid="row-glyph">
        <CategoryGlyph categoryId={expense.categoryId} />
      </span>
      <span className={styles.detail}>
        <span className={styles.title} data-testid="row-title">
          {title}
        </span>
        <span className={styles.category} data-testid="row-category">
          {category.label}
        </span>
      </span>
      <span className={styles.amount} data-testid="row-amount">
        {formatAmount(expense)}
      </span>
    </button>
  );
}
