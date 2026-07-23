import { supabase } from "@/lib/supabase";
import { addWeeks, getMonthRange, getWeekRange } from "@/lib/dates";
import { weeklyTotalsFromRows, sumAmounts } from "@/lib/finops-aggregate";
import { FinOpsScreen } from "@/components/finops/finops-screen";
import type { TransactionRow } from "@/lib/finops-shared";

export const dynamic = "force-dynamic";

export default async function FinOpsPage() {
  const { weekStart, weekEnding } = getWeekRange(new Date());
  const { monthStart, monthEnd } = getMonthRange(new Date());
  const weekEndings = [3, 2, 1, 0].map((n) => addWeeks(weekEnding, -n));
  const fourWeeksAgoEnding = weekEndings[0];

  const [weekResult, monthResult, fourWeekResult] = await Promise.all([
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
      .select("amount")
      .gte("week_ending", monthStart)
      .lte("week_ending", monthEnd)
      .gte("amount", 0)
      .returns<{ amount: number }[]>(),
    supabase
      .from("transactions")
      .select("amount, week_ending")
      .gte("week_ending", fourWeeksAgoEnding)
      .lte("week_ending", weekEnding)
      .gte("amount", 0)
      .returns<{ amount: number; week_ending: string }[]>(),
  ]);

  if (weekResult.error || monthResult.error || fourWeekResult.error) {
    const error = weekResult.error ?? monthResult.error ?? fourWeekResult.error;
    return (
      <main className="min-h-dvh bg-muted/30 px-4 py-6">
        <p className="text-destructive">Failed to load transactions: {error?.message}</p>
      </main>
    );
  }

  const weekRows = weekResult.data ?? [];
  const monthRows = monthResult.data ?? [];
  const fourWeekRows = fourWeekResult.data ?? [];

  const fourWeekTotals = weeklyTotalsFromRows(fourWeekRows, weekEndings);

  return (
    <FinOpsScreen
      weekRows={weekRows}
      weekTotal={sumAmounts(weekRows)}
      monthTotal={monthRows.reduce((sum, r) => sum + r.amount, 0)}
      monthTransactionCount={monthRows.length}
      fourWeekTotals={fourWeekTotals}
    />
  );
}
