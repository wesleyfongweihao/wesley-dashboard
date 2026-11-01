import { FLEX_CATEGORIES } from "@/lib/finops-shared";

/** Wesley's fixed personal budgets — not stored in the database, just the
 * two numbers he tracks himself against. Edit here if they ever change. */
export const WEEKLY_POCKET_BUDGET = 200;
export const MONTHLY_GROCERY_BUDGET = 640;

/** "Pocket" is every Flex category except Grocery, which gets its own
 * monthly-budget card instead of sharing the weekly one. */
export const POCKET_CATEGORIES = FLEX_CATEGORIES.filter((c) => c !== "Grocery");

/** Fixed category -> color assignment (never re-ordered by amount), chosen
 * from the app's existing accent colors plus a validated categorical set —
 * see the dataviz skill's palette validator. Order matches POCKET_CATEGORIES
 * so adjacent bar segments are always this exact, pre-validated sequence. */
export const POCKET_CATEGORY_COLORS: Record<string, string> = {
  Food: "#00A3DA",
  Shop: "#EB6834",
  Transport: "#1BAF7A",
  Sport: "#F59E0B",
  Entertainment: "#E87BA4",
  Events: "#8B7CF6",
  Others: "#E0735A",
};

/** One shade per week within a month, oldest first, darkest first. */
export const GROCERY_WEEK_COLORS = ["#184F95", "#2A78D6", "#5598E7", "#86B6EF", "#B7D3F6"];

export type PocketCategoryTotal = { category: string; amount: number };

/** This week's Flex spend (excluding Grocery) by category, in the fixed
 * POCKET_CATEGORIES order — categories with no spend this week are omitted. */
export function getPocketBreakdown(
  rows: { mode: string; category: string; amount: number }[]
): PocketCategoryTotal[] {
  const totals = new Map<string, number>();
  for (const row of rows) {
    if (row.mode !== "Flex" || row.category === "Grocery") continue;
    totals.set(row.category, (totals.get(row.category) ?? 0) + row.amount);
  }
  return POCKET_CATEGORIES.filter((c) => (totals.get(c) ?? 0) > 0).map((category) => ({
    category,
    amount: totals.get(category) ?? 0,
  }));
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
