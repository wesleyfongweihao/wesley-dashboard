import { supabase } from "@/lib/supabase";
import { formatShortDay } from "@/lib/format";
import { PageHeader } from "@/components/finops/page-header";
import { TransactionRowCard } from "@/components/finops/transaction-row-card";
import { Amount } from "@/components/finops/amount";
import type { TransactionRow } from "@/lib/finops-shared";

export const dynamic = "force-dynamic";

export default async function DashboardDayPage({
  params,
  searchParams,
}: {
  params: Promise<{ date: string }>;
  searchParams: Promise<{ month?: string }>;
}) {
  const { date } = await params;
  const { month } = await searchParams;
  const backHref = month ? `/finops/dashboard?month=${month}` : "/finops/dashboard";

  const { data, error } = await supabase
    .from("transactions")
    .select("*")
    .eq("txn_date", date)
    .gte("amount", 0)
    .order("created_at", { ascending: true })
    .returns<TransactionRow[]>();

  if (error) {
    return (
      <main className="min-h-dvh bg-muted/30 px-4 py-6">
        <p className="text-destructive">Failed to load transactions: {error.message}</p>
      </main>
    );
  }

  const rows = data ?? [];
  const total = rows.reduce((sum, r) => sum + r.amount, 0);

  return (
    <main className="min-h-dvh bg-background pb-10">
      <PageHeader title={formatShortDay(date)} backHref={backHref} />
      <div className="mx-auto w-full max-w-md space-y-4 px-4 pt-6">
        {rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">No transactions on this day.</p>
        ) : (
          <>
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>
                {rows.length} transaction{rows.length === 1 ? "" : "s"}
              </span>
              <Amount value={total} size={16} />
            </div>
            <TransactionRowCard rows={rows} />
          </>
        )}
      </div>
    </main>
  );
}
