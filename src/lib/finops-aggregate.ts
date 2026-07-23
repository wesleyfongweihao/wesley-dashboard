import type { TransactionRow } from "@/components/transaction-form";
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

export function getModeTotals(rows: TransactionRow[]): Record<ModeKey, number> {
  const totals: Record<ModeKey, number> = { Flex: 0, Fixed: 0, "Big Amount": 0 };
  for (const row of rows) {
    totals[toModeKey(row.mode)] += row.amount;
  }
  return totals;
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
      total: dayRows.reduce((sum, r) => sum + r.amount, 0),
      rows: dayRows,
    }))
    .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
}
