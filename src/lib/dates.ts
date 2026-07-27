export function toDateString(d: Date) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function parseDateString(s: string) {
  const [year, month, day] = s.split("-").map(Number);
  return new Date(year, month - 1, day);
}

export function addDays(dateStr: string, delta: number) {
  const d = parseDateString(dateStr);
  return toDateString(new Date(d.getFullYear(), d.getMonth(), d.getDate() + delta));
}

/** Mon–Sun week; weekEnding is the Sunday on/after the anchor date. */
export function getWeekRange(anchor: Date) {
  const dayOfWeek = anchor.getDay();
  const daysToSunday = (7 - dayOfWeek) % 7;
  const weekEndingDate = new Date(
    anchor.getFullYear(),
    anchor.getMonth(),
    anchor.getDate() + daysToSunday
  );
  const weekStartDate = new Date(
    weekEndingDate.getFullYear(),
    weekEndingDate.getMonth(),
    weekEndingDate.getDate() - 6
  );
  return {
    weekStart: toDateString(weekStartDate),
    weekEnding: toDateString(weekEndingDate),
  };
}

export function addWeeks(weekEndingStr: string, delta: number) {
  const d = parseDateString(weekEndingStr);
  const shifted = new Date(d.getFullYear(), d.getMonth(), d.getDate() + delta * 7);
  return toDateString(shifted);
}

/** First/last day of the calendar month containing `anchor`. */
export function getMonthRange(anchor: Date) {
  const monthStart = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
  const monthEnd = new Date(anchor.getFullYear(), anchor.getMonth() + 1, 0);
  return {
    monthStart: toDateString(monthStart),
    monthEnd: toDateString(monthEnd),
  };
}

/** "YYYY-MM" key for a given month, e.g. "2026-07". */
export function toMonthKey(year: number, monthIndex: number) {
  return `${year}-${String(monthIndex + 1).padStart(2, "0")}`;
}

export function currentMonthKey() {
  const now = new Date();
  return toMonthKey(now.getFullYear(), now.getMonth());
}

/** The "current" month per the app's week_ending-month business rule —
 * i.e. the month that today's in-progress week belongs to, which can run
 * ahead of the plain calendar month near a month boundary (e.g. Jul 27
 * whose week ends Aug 2 counts as August). */
export function currentMonthKeyByWeekEnding() {
  const { weekEnding } = getWeekRange(new Date());
  return weekEnding.slice(0, 7);
}

export function addMonthsToKey(monthKey: string, delta: number) {
  const [year, month] = monthKey.split("-").map(Number);
  const shifted = new Date(year, month - 1 + delta, 1);
  return toMonthKey(shifted.getFullYear(), shifted.getMonth());
}

/** First/last day of the calendar month identified by a "YYYY-MM" key. */
export function getMonthRangeFromKey(monthKey: string) {
  const [year, month] = monthKey.split("-").map(Number);
  return getMonthRange(new Date(year, month - 1, 1));
}

/** "Jul 2026" for a "YYYY-MM" key. */
export function formatMonthYear(monthKey: string) {
  const [year, month] = monthKey.split("-").map(Number);
  const d = new Date(year, month - 1, 1);
  return d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

/** "Jul" for a "YYYY-MM" key. */
export function formatMonthAbbr(monthKey: string) {
  const [year, month] = monthKey.split("-").map(Number);
  const d = new Date(year, month - 1, 1);
  return d.toLocaleDateString("en-US", { month: "short" });
}

export function getYearRange(year: number) {
  return { yearStart: `${year}-01-01`, yearEnd: `${year}-12-31` };
}

/** All Sundays (week_ending values) whose date falls within [start, end]. */
export function getWeekEndingsInRange(start: string, end: string): string[] {
  const endings: string[] = [];
  let cursor = parseDateString(start);
  const endDate = parseDateString(end);
  while (cursor <= endDate) {
    if (cursor.getDay() === 0) endings.push(toDateString(cursor));
    cursor = new Date(cursor.getFullYear(), cursor.getMonth(), cursor.getDate() + 1);
  }
  return endings;
}

export function getWeekRangeLabel(weekEndingStr: string) {
  const weekEnding = parseDateString(weekEndingStr);
  const weekStart = new Date(
    weekEnding.getFullYear(),
    weekEnding.getMonth(),
    weekEnding.getDate() - 6
  );
  const sameMonth = weekStart.getMonth() === weekEnding.getMonth();
  const startFmt = weekStart.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
  const endFmt = weekEnding.toLocaleDateString("en-US", {
    month: sameMonth ? undefined : "short",
    day: "numeric",
    year: "numeric",
  });
  return `${startFmt} – ${endFmt}`;
}
