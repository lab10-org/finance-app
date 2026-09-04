"use client";

import { ExpenseSheet } from "@/components/sheet/ExpenseSheet";
import { UndoToast } from "@/components/sheet/UndoToast";
import { CATEGORY_ORDER } from "@/lib/domain/categories";
import { addMonths, firstDayOf, monthKeyOf, previousMonth } from "@/lib/domain/dates";
import {
  categoryBreakdown,
  dailyAverage,
  groupByDay,
  monthComparison,
  monthTotal,
  topCategory,
} from "@/lib/domain/summary";
import { useBookActions } from "@/state/book-actions";
import { useBook, windowExpenses } from "@/state/book-store";

import { AccountControl } from "./AccountControl";
import { MonthHeader } from "./MonthHeader";
import { MonthTotal } from "./MonthTotal";
import { CategoryBreakdown } from "./CategoryBreakdown";
import { SummaryRow } from "./SummaryRow";
import { CategoryFilter } from "./CategoryFilter";
import { Book } from "./Book";
import { EmptyMonth } from "./EmptyMonth";
import { RegisterButton } from "./RegisterButton";
import styles from "./BookScreen.module.css";

export default function BookScreen() {
  const context = useBook();
  const { state, dispatch } = context;
  const actions = useBookActions(context);
  const { viewedMonth, filter, today, sheet: sheetState } = state;
  // The window flattened: every pure function below still sees a plain list.
  const expenses = windowExpenses(state, viewedMonth);

  const breakdown = categoryBreakdown(expenses, viewedMonth);
  /*
   * Chips follow the fixed category order, not the breakdown's share order, so
   * they keep their places as amounts change instead of reshuffling under the
   * user's thumb (7.1).
   */
  const present = new Set(breakdown.map((slice) => slice.categoryId));
  const availableCategories = CATEGORY_ORDER.filter((id) => present.has(id));
  const days = groupByDay(expenses, viewedMonth, filter);
  /* The list and the month total follow the filter; the metrics below do not (7.4, 7.5). */
  const visibleTotal = days.reduce((sum, day) => sum + day.subtotal, 0);
  /* Emptiness is a property of the month, not of the filtered view (3.1). */
  const isEmptyMonth = monthTotal(expenses, viewedMonth) === 0;

  const openSheet = () => dispatch({ type: "openSheet", sheet: { mode: "create" } });
  const closeSheet = () => dispatch({ type: "closeSheet" });

  /*
   * A new expense defaults to today when the current month is on screen, and
   * to the first day of whichever month is being viewed otherwise (4.5).
   */
  const defaultDate =
    viewedMonth === monthKeyOf(today) ? today : firstDayOf(viewedMonth);

  const editing =
    sheetState.mode === "edit"
      ? (expenses.find((e) => e.id === sheetState.expenseId) ?? null)
      : null;

  const canGoForward = viewedMonth < monthKeyOf(today);
  const goto = (delta: number) =>
    void actions.goTo(addMonths(viewedMonth, delta));

  return (
    <div className={styles.screen}>
      <header className={styles.header}>
        <MonthHeader
          month={viewedMonth}
          canGoForward={canGoForward}
          action={<AccountControl />}
          onPrev={() => goto(-1)}
          onNext={() => goto(1)}
        />
        <MonthTotal
          total={visibleTotal}
          comparison={monthComparison(expenses, viewedMonth)}
        />
        <CategoryBreakdown slices={breakdown} />
      </header>

      <SummaryRow
        previous={{
          total: monthTotal(expenses, previousMonth(viewedMonth)),
          month: previousMonth(viewedMonth),
        }}
        average={dailyAverage(expenses, viewedMonth, today)}
        top={topCategory(expenses, viewedMonth)}
      />

      <CategoryFilter
        available={[...availableCategories]}
        selected={filter}
        month={viewedMonth}
        onSelect={(next) => dispatch({ type: "setFilter", filter: next })}
      />

      <span className={styles.rule} />

      {isEmptyMonth ? (
        <EmptyMonth month={viewedMonth} onRegister={openSheet} />
      ) : (
        <>
          <Book
            days={days}
            month={viewedMonth}
            total={visibleTotal}
            today={today}
            onSelect={(expenseId) =>
              dispatch({ type: "openSheet", sheet: { mode: "edit", expenseId } })
            }
          />
          <RegisterButton onPress={openSheet} />
        </>
      )}

      {editing && (
        <ExpenseSheet
          key={editing.id}
          mode="edit"
          expense={editing}
          onSubmit={(draft) => void actions.edit(editing.id, draft)}
          onDelete={() => void actions.remove(editing.id)}
          onDismiss={closeSheet}
        />
      )}

      {state.pendingDeletion && (
        <UndoToast onUndo={() => void actions.undo()} />
      )}

      {sheetState.mode === "create" && (
        <ExpenseSheet
          mode="create"
          defaultDate={defaultDate}
          onSubmit={(draft) => void actions.register(draft)}
          onDismiss={closeSheet}
        />
      )}
    </div>
  );
}
