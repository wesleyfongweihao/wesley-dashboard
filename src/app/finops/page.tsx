import { supabase } from "@/lib/supabase";
import {
  addDays,
  addWeeks,
  currentMonthKeyByWeekEnding,
  formatMonthAbbr,
  getMonthRangeFromKey,
  getWeekRange,
  toDateString,
} from "@/lib/dates";
import { weeklyTotalsFromRows } from "@/lib/finops-aggregate";
import { FinOpsScreen } from "@/components/finops/finops-screen";
import type { TransactionRow } from "@/lib/finops-shared";

export const dynamic = "force-dynamic";

export default async function FinOpsPage() {
  const { weekStart, weekEnding } = getWeekRange(new Date());
  const monthKey = currentMonthKeyByWeekEnding();
  const { monthStart, monthEnd } = getMonthRangeFromKey(monthKey);
  const weekEndings = [3, 2, 1, 0].map((n) => addWeeks(weekEnding, -n));
  const fourWeeksAgoEnding = weekEndings[0];
  const today = toDateString(new Date());
  const fourteenDaysAgo = addDays(today, -13);

  const [weekResult, groceryMonthResult, fourWeekResult, recentResult] = await Promise.all([
    supabase
      .from("transactions")
      .select("*")
      .gte("txn_date", weekStart)
      .lte("txn_date", weekEnding)
      .gte("amount", 0)
      .order("txn_date", { ascending: false })
      .order("created_at", { ascending: true })
      .returns<TransactionRow[]>(),
    supabase
      .from("transactions")
      .select("amount, week_ending")
      .eq("category", "Grocery")
      .gte("week_ending", monthStart)
      .lte("week_ending", monthEnd)
      .gte("amount", 0)
      .returns<{ amount: number; week_ending: string }[]>(),
    supabase
      .from("transactions")
      .select("amount, week_ending")
      .eq("mode", "Flex")
      .gte("week_ending", fourWeeksAgoEnding)
      .lte("week_ending", weekEnding)
      .gte("amount", 0)
      .returns<{ amount: number; week_ending: string }[]>(),
    supabase
      .from("transactions")
      .select("*")
      .gte("txn_date", fourteenDaysAgo)
      .lte("txn_date", today)
      .gte("amount", 0)
      .order("txn_date", { ascending: false })
      .order("created_at", { ascending: true })
      .returns<TransactionRow[]>(),
  ]);

  if (weekResult.error || groceryMonthResult.error || fourWeekResult.error || recentResult.error) {
    const error =
      weekResult.error ?? groceryMonthResult.error ?? fourWeekResult.error ?? recentResult.error;
    return (
      <main className="min-h-dvh bg-muted/30 px-4 py-6">
        <p className="text-destructive">Failed to load transactions: {error?.message}</p>
      </main>
    );
  }

  const weekRows = weekResult.data ?? [];
  const groceryMonthRows = groceryMonthResult.data ?? [];
  const fourWeekRows = fourWeekResult.data ?? [];
  const recentRows = recentResult.data ?? [];

  const fourWeekTotals = weeklyTotalsFromRows(fourWeekRows, weekEndings);

  return (
    <FinOpsScreen
      weekRows={weekRows}
      groceryMonthRows={groceryMonthRows}
      groceryMonthLabel={formatMonthAbbr(monthKey)}
      fourWeekTotals={fourWeekTotals}
      recentRows={recentRows}
    />
  );
}
