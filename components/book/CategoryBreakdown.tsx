"use client";

import { CATEGORY_BY_ID } from "@/lib/domain/categories";
import type { BreakdownSlice } from "@/lib/domain/summary";
import { formatSharePercent } from "@/lib/format";

import styles from "./CategoryBreakdown.module.css";

const LEGEND_SIZE = 3;

export interface CategoryBreakdownProps {
  slices: BreakdownSlice[];
}

export function CategoryBreakdown({ slices }: CategoryBreakdownProps) {
  if (slices.length === 0) {
    // An empty month collapses to a single neutral bar, with no legend (2.10).
    return (
      <div className={styles.breakdown}>
        <div className={styles.empty} data-testid="breakdown-empty" />
      </div>
    );
  }

  return (
    <div className={styles.breakdown}>
      <div className={styles.bar} data-testid="breakdown-bar">
        {slices.map((slice) => {
          const category = CATEGORY_BY_ID[slice.categoryId];
          return (
            <div
              key={slice.categoryId}
              className={styles.segment}
              data-testid={`breakdown-segment-${slice.categoryId}`}
              data-category={slice.categoryId}
              style={{
                // Growing by the raw total keeps the segments proportional
                // without any percentage arithmetic in the component.
                flexGrow: slice.total,
                background: `var(${category.colorToken})`,
              }}
            />
          );
        })}
      </div>
      <div className={styles.legend} data-testid="breakdown-legend">
        {slices.slice(0, LEGEND_SIZE).map((slice) => {
          const category = CATEGORY_BY_ID[slice.categoryId];
          return (
            <div key={slice.categoryId} className={styles.item}>
              <span
                className={styles.dot}
                style={{ background: `var(${category.colorToken})` }}
              />
              <span className={styles.label}>
                {category.label} {formatSharePercent(slice.share)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
