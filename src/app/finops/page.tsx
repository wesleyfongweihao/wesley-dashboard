import { supabase } from "@/lib/supabase";
import { getWeekRange } from "@/lib/dates";
import { FinOpsScreen } from "@/components/finops/finops-screen";
import type { TransactionRow } from "@/components/transaction-form";

export const dynamic = "force-dynamic";

export default async function FinOpsPage() {
  const { weekStart, weekEnding } = getWeekRange(new Date());

  const { data: transactions, error } = await supabase
    .from("transactions")
    .select("*")
    .gte("txn_date", weekStart)
    .lte("txn_date", weekEnding)
    .gte("amount", 0)
    .order("txn_date", { ascending: false })
    .order("created_at", { ascending: true })
    .returns<TransactionRow[]>();

  if (error) {
    return (
      <main className="min-h-dvh bg-muted/30 px-4 py-6">
        <p className="text-destructive">Failed to load transactions: {error.message}</p>
      </main>
    );
  }

  return (
    <FinOpsScreen initialWeekEnding={weekEnding} initialRows={transactions ?? []} />
  );
}
