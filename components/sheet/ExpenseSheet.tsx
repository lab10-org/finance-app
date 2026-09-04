"use client";

import { Trash2, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { CategoryGlyph } from "@/components/book/CategoryGlyph";
import { CATEGORIES } from "@/lib/domain/categories";
import type { CategoryId, Expense, ExpenseDraft, IsoDate } from "@/lib/domain/types";
import { formatAmountInput, parseAmountInput } from "@/lib/format";

import styles from "./ExpenseSheet.module.css";

export type ExpenseSheetProps =
  | {
      mode: "create";
      defaultDate: IsoDate;
      onSubmit: (draft: ExpenseDraft) => void;
      onDismiss: () => void;
    }
  | {
      mode: "edit";
      expense: Expense;
      onSubmit: (draft: ExpenseDraft) => void;
      onDelete: () => void;
      onDismiss: () => void;
    };

export function ExpenseSheet(props: ExpenseSheetProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const amountRef = useRef<HTMLInputElement>(null);

  const initial = props.mode === "edit" ? props.expense : null;
  const [amount, setAmount] = useState(
    initial ? formatAmountInput(String(initial.amount)) : "",
  );
  const [categoryId, setCategoryId] = useState<CategoryId | null>(
    initial?.categoryId ?? null,
  );
  const [description, setDescription] = useState(initial?.description ?? "");
  const [date, setDate] = useState<IsoDate>(
    props.mode === "edit" ? props.expense.date : props.defaultDate,
  );

  /*
   * A native <dialog> opened with showModal() gives the focus trap, Escape and
   * the inert background for free, and leaves the book mounted behind it (4.1).
   */
  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) dialog.showModal?.();
    amountRef.current?.focus();
  }, []);

  const amountValue = parseAmountInput(amount);
  const canConfirm = amountValue > 0 && categoryId !== null;

  const confirm = () => {
    if (!canConfirm || categoryId === null) return;
    props.onSubmit({
      amount: amountValue,
      categoryId,
      description: description.trim() || undefined,
      date,
    });
  };

  return (
    <dialog
      ref={dialogRef}
      className={styles.dialog}
      data-testid="expense-sheet"
      onCancel={(event) => {
        event.preventDefault();
        props.onDismiss();
      }}
    >
      <div className={styles.sheet}>
        <div className={styles.head}>
          <span className={styles.title}>
            {props.mode === "edit" ? "Editar gasto" : "Nuevo gasto"}
          </span>
          <button
            type="button"
            className={styles.close}
            aria-label="Cerrar"
            onClick={props.onDismiss}
          >
            <X size={18} strokeWidth={2} aria-hidden />
          </button>
        </div>

        <div className={styles.amountField}>
          <span className={styles.currency} aria-hidden>
            $
          </span>
          <input
            ref={amountRef}
            className={styles.amountInput}
            aria-label="Monto"
            inputMode="numeric"
            autoComplete="off"
            placeholder="0"
            value={amount}
            onChange={(e) => setAmount(formatAmountInput(e.target.value))}
          />
        </div>

        <div className={styles.chips} data-testid="sheet-categories">
          {CATEGORIES.map((category) => {
            const selected = category.id === categoryId;
            return (
              <button
                key={category.id}
                type="button"
                aria-pressed={selected}
                className={`${styles.chip} ${selected ? styles.chipSelected : ""}`}
                onClick={() => setCategoryId(category.id)}
              >
                <CategoryGlyph categoryId={category.id} size={14} />
                {category.label}
              </button>
            );
          })}
        </div>

        <div className={styles.fields}>
          <label className={styles.field}>
            <span className={styles.fieldLabel}>DESCRIPCIÓN</span>
            <input
              className={styles.input}
              placeholder="Opcional"
              autoComplete="off"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </label>
          <label className={styles.field}>
            <span className={styles.fieldLabel}>FECHA</span>
            <input
              type="date"
              className={`${styles.input} ${styles.dateInput}`}
              value={date}
              onChange={(e) => setDate(e.target.value || date)}
            />
          </label>
        </div>

        <button
          type="button"
          className={styles.confirm}
          disabled={!canConfirm}
          onClick={confirm}
        >
          Guardar
        </button>

        {props.mode === "edit" && (
          <button type="button" className={styles.delete} onClick={props.onDelete}>
            <Trash2 size={14} strokeWidth={2} aria-hidden />
            Eliminar
          </button>
        )}
      </div>
    </dialog>
  );
}
