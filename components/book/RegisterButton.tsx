"use client";

import { Plus } from "lucide-react";

import styles from "./RegisterButton.module.css";

export function RegisterButton({ onPress }: { onPress: () => void }) {
  return (
    <div className={styles.dock}>
      <div className={styles.inner}>
        <button type="button" className={styles.fab} onClick={onPress}>
          <Plus size={18} strokeWidth={2.25} aria-hidden />
          Registrar
        </button>
      </div>
    </div>
  );
}
