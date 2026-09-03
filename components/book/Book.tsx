"use client";

import type { DayGroup as DayGroupModel } from "@/lib/domain/summary";
import type { IsoDate, MonthKey } from "@/lib/domain/types";
import { formatCop, formatMonthNameUpper } from "@/lib/format";

import { DayGroup } from "./DayGroup";
import styles from "./Book.module.css";

export interface BookProps {
  days: DayGroupModel[];
  month: MonthKey;
  total: number;
  today: IsoDate;
  onSelect: (id: string) => void;
}

export function Book({ days, month, total, today, onSelect }: BookProps) {
  return (
    <div className={styles.book}>
      {days.map((day) => (
        <DayGroup key={day.date} day={day} today={today} onSelect={onSelect} />
      ))}
      <div className={styles.closing}>
        <span className={styles.rule} />
        <div className={styles.sum}>
          <span className={styles.sumLabel}>
            TOTAL DE {formatMonthNameUpper(month)}
          </span>
          <span className={styles.sumAmount} data-testid="book-footer-total">
            {formatCop(total)}
          </span>
        </div>
      </div>
    </div>
  );
}
