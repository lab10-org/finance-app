import { describe, expect, it } from "vitest";

import {
  addMonths,
  daysInMonth,
  dayOfMonth,
  elapsedDays,
  monthKeyOf,
  previousMonth,
} from "@/lib/domain/dates";

describe("date helpers", () => {
  it("derives the month key from a date without parsing it", () => {
    expect(monthKeyOf("2026-09-03")).toBe("2026-09");
    expect(monthKeyOf("2026-01-31")).toBe("2026-01");
  });

  it("reads the day of the month", () => {
    expect(dayOfMonth("2026-09-03")).toBe(3);
    expect(dayOfMonth("2026-09-30")).toBe(30);
  });

  it("counts the days of a month, leap years included", () => {
    expect(daysInMonth("2026-02")).toBe(28);
    expect(daysInMonth("2024-02")).toBe(29);
    expect(daysInMonth("2026-09")).toBe(30);
    expect(daysInMonth("2026-12")).toBe(31);
  });

  it("steps between months across a year boundary", () => {
    expect(addMonths("2026-09", 1)).toBe("2026-10");
    expect(addMonths("2026-12", 1)).toBe("2027-01");
    expect(addMonths("2026-01", -1)).toBe("2025-12");
    expect(previousMonth("2026-09")).toBe("2026-08");
  });
});

describe("elapsedDays (2.3)", () => {
  it("counts today's day of the month for the current month", () => {
    expect(elapsedDays("2026-09", "2026-09-03")).toBe(3);
    expect(elapsedDays("2026-09", "2026-09-27")).toBe(27);
  });

  it("counts the whole month for a past month", () => {
    expect(elapsedDays("2026-08", "2026-09-03")).toBe(31);
    expect(elapsedDays("2026-02", "2026-09-03")).toBe(28);
  });

  it("counts nothing for a month that has not started", () => {
    expect(elapsedDays("2026-10", "2026-09-03")).toBe(0);
  });
});
