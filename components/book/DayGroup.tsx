"use client";

import { Fragment } from "react";

import type { DayGroup as DayGroupModel } from "@/lib/domain/summary";
import type { IsoDate } from "@/lib/domain/types";
import { formatCop, formatDayStrip } from "@/lib/format";

import { ExpenseRow } from "./ExpenseRow";
import rowStyles from "./ExpenseRow.module.css";
import styles from "./DayGroup.module.css";

export interface DayGroupProps {
  day: DayGroupModel;
  today: IsoDate;
  onSelect: (id: string) => void;
}

export function DayGroup({ day, today, onSelect }: DayGroupProps) {
  return (
    <section className={styles.group} data-testid={`day-${day.date}`}>
      <div className={styles.strip} data-testid="day-strip">
        <span className={styles.date} data-testid="day-label">
          {formatDayStrip(day.date, today)}
        </span>
        <span className={styles.subtotal} data-testid="day-subtotal">
          {formatCop(day.subtotal)}
        </span>
      </div>
      {day.expenses.map((expense, index) => (
        <Fragment key={expense.id}>
          {index > 0 && <span className={rowStyles.hairline} />}
          <ExpenseRow expense={expense} onSelect={onSelect} />
        </Fragment>
      ))}
    </section>
  );
}
