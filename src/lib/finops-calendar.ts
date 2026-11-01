import { addDays, getMonthRangeFromKey, getWeekEndingsInRange, toMonthKey } from "@/lib/dates";
import { getModeTotals } from "@/lib/finops-aggregate";
import type { ModeKey } from "@/lib/mode-colors";

export type CalendarDay = {
  date: string;
  inMonth: boolean;
  isFuture: boolean;
  isToday: boolean;
};

export type ModeFilter = "All" | "Flex" | "Fixed" | "Big";
export const MODE_FILTERS: ModeFilter[] = ["All", "Flex", "Fixed", "Big"];

export function matchesModeFilter(mode: string, filter: ModeFilter): boolean {
  if (filter === "All") return true;
  if (filter === "Big") return mode !== "Flex" && mode !== "Fixed";
  return mode === filter;
}

/** Every day belonging to a week whose week_ending falls in `monthKey`
 * ("YYYY-MM"), grouped Mon–Sun, oldest week first. Days from the previous
 * calendar month are included (and flagged `inMonth: false`) whenever
 * their week's week_ending lands in this month. */
export function buildCalendarDays(monthKey: string, todayStr: string): CalendarDay[] {
  const { monthStart, monthEnd } = getMonthRangeFromKey(monthKey);
  const weekEndings = getWeekEndingsInRange(monthStart, monthEnd);

  const days: CalendarDay[] = [];
  for (const weekEnding of weekEndings) {
    for (let i = 6; i >= 0; i--) {
      const date = addDays(weekEnding, -i);
      days.push({
        date,
        inMonth: date.slice(0, 7) === monthKey,
        isFuture: date > todayStr,
        isToday: date === todayStr,
      });
    }
  }
  return days;
}

export type YearMonthTotal = {
  monthKey: string;
  total: number;
  modeTotals: { mode: ModeKey; amount: number }[];
  weekCount: number;
};

/** Buckets a year's worth of rows into one entry per calendar month,
 * grouped by the month of `week_ending` (same rule as the month view). */
export function buildYearMonthTotals(
  rows: { amount: number; mode: string; week_ending: string }[],
  year: number
): YearMonthTotal[] {
  const months: YearMonthTotal[] = [];
  for (let m = 0; m < 12; m++) {
    const monthKey = toMonthKey(year, m);
    const monthRows = rows.filter((r) => r.week_ending.slice(0, 7) === monthKey);
    const { monthStart, monthEnd } = getMonthRangeFromKey(monthKey);
    months.push({
      monthKey,
      total: monthRows.reduce((sum, r) => sum + r.amount, 0),
      modeTotals: getModeTotals(monthRows),
      weekCount: getWeekEndingsInRange(monthStart, monthEnd).length,
    });
  }
  return months;
}
