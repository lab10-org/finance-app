"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import type { ReactNode } from "react";

import { formatMonthTitle } from "@/lib/format";
import type { MonthKey } from "@/lib/domain/types";

import styles from "./MonthHeader.module.css";

export interface MonthHeaderProps {
  month: MonthKey;
  canGoForward: boolean;
  onPrev: () => void;
  onNext: () => void;
  /**
   * The right-hand slot the v1 search icon vacated (6.1). Optional and
   * uninterpreted, so the existing month-header tests keep rendering unchanged.
   */
  action?: ReactNode;
}

export function MonthHeader({
  month,
  canGoForward,
  onPrev,
  onNext,
  action,
}: MonthHeaderProps) {
  return (
    <div className={styles.nav}>
      <div className={styles.selector}>
        <button type="button" className={styles.step} aria-label="Mes anterior" onClick={onPrev}>
          <ChevronLeft size={15} strokeWidth={2} aria-hidden />
        </button>
        <span className={styles.title}>{formatMonthTitle(month)}</span>
        <button
          type="button"
          className={styles.step}
          aria-label="Mes siguiente"
          onClick={onNext}
          disabled={!canGoForward}
        >
          <ChevronRight size={15} strokeWidth={2} aria-hidden />
        </button>
      </div>
      {/* Where the v1 search control used to be (8.7); now the account slot. */}
      {action}
    </div>
  );
}
