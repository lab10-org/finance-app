"use client";

import styles from "./UndoToast.module.css";

export interface UndoToastProps {
  onUndo: () => void;
}

/** Shown while a deletion is still recoverable (6.1, 6.3). */
export function UndoToast({ onUndo }: UndoToastProps) {
  return (
    <div className={styles.dock}>
      <div className={styles.toast} role="status" data-testid="undo-toast">
        <span>Gasto eliminado</span>
        <button type="button" className={styles.undo} onClick={onUndo}>
          Deshacer
        </button>
      </div>
    </div>
  );
}
