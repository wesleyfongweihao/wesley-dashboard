import type { TransactionRow } from "@/lib/finops-shared";
import type { ModeKey } from "@/lib/mode-colors";

export type CategoryTotal = {
  mode: ModeKey;
  category: string;
  amount: number;
};

export type DayGroup = {
  date: string;
  total: number;
  rows: TransactionRow[];
};

function toModeKey(mode: string): ModeKey {
  return mode === "Flex" || mode === "Fixed" ? mode : "Big Amount";
}

export function sumAmounts(rows: TransactionRow[]): number {
  return rows.reduce((sum, r) => sum + r.amount, 0);
}

export function getCategoryTotals(rows: TransactionRow[]): CategoryTotal[] {
  const map = new Map<string, CategoryTotal>();
  for (const row of rows) {
    const modeKey = toModeKey(row.mode);
    const key = `${modeKey}::${row.category}`;
    const existing = map.get(key);
    if (existing) {
      existing.amount += row.amount;
    } else {
      map.set(key, { mode: modeKey, category: row.category, amount: row.amount });
    }
  }
  return [...map.values()];
}

/** Highest-spend category for a set of rows, with its share of the total. */
export function getTopCategory(
  rows: TransactionRow[]
): { mode: ModeKey; category: string; amount: number; percentOfTotal: number } | null {
  const totals = getCategoryTotals(rows);
  if (totals.length === 0) return null;
  const total = sumAmounts(rows);
  const top = totals.reduce((max, c) => (c.amount > max.amount ? c : max), totals[0]);
  return {
    ...top,
    percentOfTotal: total > 0 ? Math.round((top.amount / total) * 100) : 0,
  };
}

/** Most recent day first, matching this app's existing txn_date-desc convention. */
export function groupByDay(rows: TransactionRow[]): DayGroup[] {
  const map = new Map<string, TransactionRow[]>();
  for (const row of rows) {
    const list = map.get(row.txn_date);
    if (list) {
      list.push(row);
    } else {
      map.set(row.txn_date, [row]);
    }
  }
  return [...map.entries()]
    .map(([date, dayRows]) => ({
      date,
      total: sumAmounts(dayRows),
      rows: dayRows,
    }))
    .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
}

/** Buckets a flat set of rows (spanning multiple weeks) into per-week
 * totals, aligned to the given ordered list of week_ending keys. */
export function weeklyTotalsFromRows(
  rows: { amount: number; week_ending: string }[],
  weekEndings: string[]
): number[] {
  const byWeek = new Map<string, number>();
  for (const row of rows) {
    byWeek.set(row.week_ending, (byWeek.get(row.week_ending) ?? 0) + row.amount);
  }
  return weekEndings.map((w) => byWeek.get(w) ?? 0);
}
