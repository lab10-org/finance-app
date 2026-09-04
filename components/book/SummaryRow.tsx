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
  /** The window has not arrived: none of the three can be stated yet (4.2, 3.6). */
  pending?: boolean;
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
export function SummaryRow({ previous, average, top, pending = false }: SummaryRowProps) {
  /*
   * "sin datos" is a claim — it says the month was read and had nothing. While
   * the window is still arriving that claim is not ours to make, so the note
   * goes silent and the value keeps the dash it already uses for the unknown
   * (4.2, 3.6). The month's name stays: it labels the column, it is not a
   * figure derived from rows that have not arrived.
   */
  const PENDING_NOTE = "";

  return (
    <div className={styles.row}>
      <Metric
        name="previous"
        label="MES ANTERIOR"
        value={pending ? NO_DATA : formatCop(previous.total)}
        note={formatMonthLower(previous.month)}
      />
      <span className={styles.rule} />
      <Metric
        name="average"
        label="PROMEDIO DIARIO"
        value={pending || !average ? NO_DATA : formatCop(average.amount)}
        note={pending ? PENDING_NOTE : average ? `${average.days} días` : NO_DATA_NOTE}
      />
      <span className={styles.rule} />
      <Metric
        name="top"
        label="MÁS GASTADO"
        value={pending || !top ? NO_DATA : formatCop(top.total)}
        note={pending ? PENDING_NOTE : top ? CATEGORY_BY_ID[top.categoryId].label : NO_DATA_NOTE}
      />
    </div>
  );
}
