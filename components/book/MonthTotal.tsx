"use client";

import { ArrowDownRight, ArrowUpRight } from "lucide-react";

import type { MonthComparison } from "@/lib/domain/summary";
import { formatCop, formatMonthLower, formatPercent } from "@/lib/format";

import styles from "./MonthTotal.module.css";

export interface MonthTotalProps {
  total: number;
  comparison: MonthComparison | null;
  /** The window has not arrived: there is no total to state yet (4.2, 3.6). */
  pending?: boolean;
}

export function MonthTotal({ total, comparison, pending = false }: MonthTotalProps) {
  const Arrow = comparison?.direction === "more" ? ArrowUpRight : ArrowDownRight;

  return (
    <div className={styles.total}>
      <span className={styles.label}>TOTAL GASTADO</span>
      <span className={styles.amount} data-testid="month-total">
        {/*
         * A month still being read has no total, and `$0` is not the honest way
         * to say so: it is a figure, in headline type, that reads as final and
         * happens to be wrong. The dash says nothing, which is exactly right
         * until the rows are here (4.2, 3.6).
         */}
        {pending ? "—" : formatCop(total)}
      </span>
      {!pending && comparison && (
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
