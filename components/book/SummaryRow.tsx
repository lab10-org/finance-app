"use client";

import { CATEGORY_BY_ID } from "@/lib/domain/categories";
import type { CategoryId, MonthKey } from "@/lib/domain/types";
import type { DailyAverage } from "@/lib/domain/summary";
import { formatCop, formatMonthLower } from "@/lib/format";

import styles from "./SummaryRow.module.css";

const NO_DATA = "—";
const NO_DATA_NOTE = "sin datos";

export interface SummaryRowProps {
  previous: { total: number; month: MonthKey };
  average: DailyAverage | null;
  top: { categoryId: CategoryId; total: number } | null;
}

function Metric({
  name,
  label,
  value,
  note,
}: {
  name: string;
  label: string;
  value: string;
  note: string;
}) {
  return (
    <div className={styles.metric} data-testid={`metric-${name}`}>
      <span className={styles.label}>{label}</span>
      <span className={styles.value} data-testid="metric-value">
        {value}
      </span>
      <span className={styles.note} data-testid="metric-note">
        {note}
      </span>
    </div>
  );
}

/*
 * These three always describe the whole month, never the filtered subset
 * (7.5) — the filter belongs to the list and the month total.
 */
export function SummaryRow({ previous, average, top }: SummaryRowProps) {
  return (
    <div className={styles.row}>
      <Metric
        name="previous"
        label="MES ANTERIOR"
        value={formatCop(previous.total)}
        note={formatMonthLower(previous.month)}
      />
      <span className={styles.rule} />
      <Metric
        name="average"
        label="PROMEDIO DIARIO"
        value={average ? formatCop(average.amount) : NO_DATA}
        note={average ? `${average.days} días` : NO_DATA_NOTE}
      />
      <span className={styles.rule} />
      <Metric
        name="top"
        label="MÁS GASTADO"
        value={top ? formatCop(top.total) : NO_DATA}
        note={top ? CATEGORY_BY_ID[top.categoryId].label : NO_DATA_NOTE}
      />
    </div>
  );
}
