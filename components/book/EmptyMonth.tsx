"use client";

import { Plus } from "lucide-react";

import type { MonthKey } from "@/lib/domain/types";
import { formatCop, formatMonthUpper } from "@/lib/format";

import styles from "./EmptyMonth.module.css";

const EMPTY_RULES = 3;

export interface EmptyMonthProps {
  month: MonthKey;
  onRegister: () => void;
}

export function EmptyMonth({ month, onRegister }: EmptyMonthProps) {
  return (
    <div className={styles.empty} data-testid="empty-month">
      <div className={styles.head} data-testid="empty-head">
        <span className={styles.headLabel}>MOVIMIENTOS DEL MES</span>
        <span className={styles.headCount}>0</span>
      </div>
      <span className={styles.divider} />

      <div className={styles.message}>
        <p className={styles.headline}>Aún no registras gastos este mes</p>
        <p className={styles.support}>
          Anota el primero y tu libro se irá llenando día por día.
        </p>
      </div>

      <div className={styles.rules}>
        {Array.from({ length: EMPTY_RULES }, (_, i) => (
          <span key={i} className={styles.divider} data-testid="empty-rule" />
        ))}
      </div>

      <div className={styles.spacer} />

      <div className={styles.action}>
        <button type="button" className={styles.cta} onClick={onRegister}>
          <Plus size={18} strokeWidth={2.25} aria-hidden />
          Registrar un gasto
        </button>
        <span className={styles.promise}>TOMA MENOS DE 10 SEGUNDOS</span>
      </div>

      <div className={styles.footer} data-testid="empty-footer">
        <span className={styles.period}>{formatMonthUpper(month)}</span>
        <span className={styles.total}>{formatCop(0)}</span>
      </div>
    </div>
  );
}
