import { describe, expect, it } from "vitest";

import {
  formatAmount,
  formatCop,
  formatDayStrip,
  formatMonthLower,
  formatMonthNameUpper,
  formatMonthTitle,
  formatMonthUpper,
  formatPercent,
  formatSharePercent,
  parseAmountInput,
} from "@/lib/format";

describe("formatAmount (10.2, 10.3)", () => {
  const base = {
    id: "e1",
    categoryId: "otros" as const,
    date: "2026-09-03",
    createdAt: 0,
  };

  it("renders a COP expense exactly as formatCop renders its number", () => {
    const e = { ...base, amount: 1284500, currency: "COP" as const };
    expect(formatAmount(e)).toBe(formatCop(1284500));
    expect(formatAmount(e)).toBe("$1.284.500");
  });

  it("keeps whole pesos when the stored amount carries decimals", () => {
    // `numeric(14,2)` round-trips as 16800.00; the book still shows "$16.800".
    const e = { ...base, amount: 16800.0, currency: "COP" as const };
    expect(formatAmount(e)).toBe("$16.800");
  });
});

describe("formatCop (9.1, 9.2)", () => {
  it("writes pesos with a dot as thousands separator and no decimals", () => {
    expect(formatCop(1284500)).toBe("$1.284.500");
    expect(formatCop(47600)).toBe("$47.600");
    expect(formatCop(500)).toBe("$500");
  });

  it("writes zero as $0", () => {
    expect(formatCop(0)).toBe("$0");
  });
});

describe("percentages (9.3, 2.7)", () => {
  it("uses a comma as the decimal separator, to one decimal", () => {
    expect(formatPercent(9.04)).toBe("9,0%");
    expect(formatPercent(12.5)).toBe("12,5%");
  });

  it("rounds a share to a whole percent", () => {
    expect(formatSharePercent(0.384)).toBe("38%");
    expect(formatSharePercent(1)).toBe("100%");
  });
});

describe("Spanish months (8.3, 2.2, 3.4, 1.9, 9.4)", () => {
  it("titles a month for the header", () => {
    expect(formatMonthTitle("2026-09")).toBe("Septiembre 2026");
    expect(formatMonthTitle("2026-01")).toBe("Enero 2026");
  });

  it("uppercases a month for the footer and the closing row", () => {
    expect(formatMonthUpper("2026-09")).toBe("SEPTIEMBRE 2026");
    expect(formatMonthNameUpper("2026-09")).toBe("SEPTIEMBRE");
  });

  it("lowercases a month name for the comparison and the note", () => {
    expect(formatMonthLower("2026-08")).toBe("agosto");
  });
});

describe("formatDayStrip (1.4)", () => {
  const today = "2026-09-03";

  it("labels today and yesterday", () => {
    expect(formatDayStrip("2026-09-03", today)).toBe("HOY");
    expect(formatDayStrip("2026-09-02", today)).toBe("AYER");
  });

  it("labels any other day with its date", () => {
    expect(formatDayStrip("2026-09-01", today)).toBe("1 DE SEPTIEMBRE");
    expect(formatDayStrip("2026-08-31", today)).toBe("31 DE AGOSTO");
  });

  it("crosses a month boundary when working out yesterday", () => {
    expect(formatDayStrip("2026-08-31", "2026-09-01")).toBe("AYER");
  });
});

describe("parseAmountInput (9.5, 9.6, 4.10)", () => {
  it("keeps digits only", () => {
    expect(parseAmountInput("48500")).toBe(48500);
    expect(parseAmountInput("48.500")).toBe(48500);
    expect(parseAmountInput("$48 500")).toBe(48500);
    expect(parseAmountInput("abc")).toBe(0);
    expect(parseAmountInput("")).toBe(0);
  });

  it("refuses decimals by dropping the separator", () => {
    expect(parseAmountInput("12,50")).toBe(1250);
  });

  it("ignores digits past 999.999.999", () => {
    expect(parseAmountInput("1234567890")).toBe(123456789);
    expect(parseAmountInput("999999999")).toBe(999999999);
  });
});
