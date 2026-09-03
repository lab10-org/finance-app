"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

import { formatMonthTitle } from "@/lib/format";
import type { MonthKey } from "@/lib/domain/types";

import styles from "./MonthHeader.module.css";

export interface MonthHeaderProps {
  month: MonthKey;
  canGoForward: boolean;
  onPrev: () => void;
  onNext: () => void;
}

export function MonthHeader({ month, canGoForward, onPrev, onNext }: MonthHeaderProps) {
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
      {/* No search control: search is out of scope for v1 (8.7). */}
    </div>
  );
}
