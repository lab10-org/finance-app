"use client";

import { formatMonthTitle } from "@/lib/format";
import type { MonthKey } from "@/lib/domain/types";
import type { WriteFailure } from "@/state/book-store";

import styles from "./BookStatus.module.css";

/**
 * A month on its way (4.2).
 *
 * Deliberately not a spinner over the old figures: showing last month's total
 * under this month's heading is worse than showing nothing, because it is wrong
 * and looks right.
 */
export function MonthLoading({ month }: { month: MonthKey }) {
  return (
    <div className={styles.panel} role="status" aria-busy="true" data-testid="month-loading">
      <span className={styles.headline}>Cargando {formatMonthTitle(month)}</span>
      <div className={styles.rows} aria-hidden="true">
        <span className={styles.row} />
        <span className={styles.row} />
        <span className={styles.row} />
      </div>
    </div>
  );
}

/**
 * A month that could not be read (3.6, 4.4).
 *
 * It says the book could not be loaded rather than showing an empty one: an
 * empty book would state that the month's spending was zero.
 */
export function MonthError({ month, onRetry }: { month: MonthKey; onRetry: () => void }) {
  return (
    <div className={styles.panel} role="alert" data-testid="month-error">
      <span className={styles.headline}>No pudimos cargar {formatMonthTitle(month)}</span>
      <p className={styles.support}>
        Revisa tu conexión. Tus gastos están guardados; solo no los pudimos traer.
      </p>
      <button type="button" className={styles.retry} onClick={onRetry}>
        Reintentar
      </button>
    </div>
  );
}

/**
 * A write that did not land (5.4, 5.5, 6.2, 6.8, 6.9, 7.5).
 *
 * Same dock and shape as the undo toast, so the two never fight for the same
 * corner of the screen and the user learns one place to look.
 */
export function WriteFailureToast({
  failure,
  onRetry,
  onDismiss,
}: {
  failure: WriteFailure;
  onRetry: () => void;
  onDismiss: () => void;
}) {
  return (
    <div className={styles.dock}>
      <div className={styles.toast} role="alert" data-testid="write-failure">
        <span className={styles.message}>{failure.message}</span>
        <span className={styles.actions}>
          <button type="button" className={styles.action} onClick={onRetry}>
            Reintentar
          </button>
          <button
            type="button"
            className={styles.dismiss}
            onClick={onDismiss}
            aria-label="Descartar el aviso"
          >
            Cerrar
          </button>
        </span>
      </div>
    </div>
  );
}
