/** Wesley's fixed personal budgets — not stored in the database, just the
 * two numbers he tracks himself against. Edit here if they ever change. */
export const WEEKLY_POCKET_BUDGET = 200;
export const MONTHLY_GROCERY_BUDGET = 640;

/** One shade per week within a month, oldest first, darkest first. */
export const GROCERY_WEEK_COLORS = ["#184F95", "#2A78D6", "#5598E7", "#86B6EF", "#B7D3F6"];

/** "Pocket" is every Flex category except Grocery, which gets its own
 * monthly-budget card instead of sharing the weekly one. */
export function getPocketSpent(rows: { mode: string; category: string; amount: number }[]): number {
  return rows
    .filter((r) => r.mode === "Flex" && r.category !== "Grocery")
    .reduce((sum, r) => sum + r.amount, 0);
}

export type WeekTotal = { weekEnding: string; amount: number };

/** Groups rows by week_ending, oldest first. */
export function getWeeklyTotals(rows: { week_ending: string; amount: number }[]): WeekTotal[] {
  const totals = new Map<string, number>();
  for (const row of rows) {
    totals.set(row.week_ending, (totals.get(row.week_ending) ?? 0) + row.amount);
  }
  return [...totals.entries()]
    .map(([weekEnding, amount]) => ({ weekEnding, amount }))
    .sort((a, b) => (a.weekEnding < b.weekEnding ? -1 : 1));
}
