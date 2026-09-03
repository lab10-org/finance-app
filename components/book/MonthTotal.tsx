"use client";

import { ArrowDownRight, ArrowUpRight } from "lucide-react";

import type { MonthComparison } from "@/lib/domain/summary";
import { formatCop, formatMonthLower, formatPercent } from "@/lib/format";

import styles from "./MonthTotal.module.css";

export interface MonthTotalProps {
  total: number;
  comparison: MonthComparison | null;
}

export function MonthTotal({ total, comparison }: MonthTotalProps) {
  const Arrow = comparison?.direction === "more" ? ArrowUpRight : ArrowDownRight;

  return (
    <div className={styles.total}>
      <span className={styles.label}>TOTAL GASTADO</span>
      <span className={styles.amount} data-testid="month-total">
        {formatCop(total)}
      </span>
      {comparison && (
        <div className={styles.comparison} data-testid="month-comparison">
          <Arrow size={13} strokeWidth={2} aria-hidden />
          <span>
            {formatPercent(comparison.percent)}{" "}
            {comparison.direction === "less" ? "menos" : "más"} que en{" "}
            {formatMonthLower(comparison.previousMonth)}
          </span>
        </div>
      )}
    </div>
  );
}
