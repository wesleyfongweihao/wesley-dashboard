import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { TransactionsList } from "@/components/transactions-list";
import type { TransactionRow } from "@/components/transaction-form";

export default async function TransactionsPage() {
  const { data: transactions, error } = await supabase
    .from("transactions")
    .select("*")
    .order("txn_date", { ascending: false })
    .returns<TransactionRow[]>();

  if (error) {
    return (
      <main className="min-h-dvh bg-muted/30 px-4 py-6">
        <p className="text-destructive">Failed to load transactions: {error.message}</p>
      </main>
    );
  }

  return (
    <main className="min-h-dvh bg-muted/30 px-4 py-6">
      <div className="mx-auto w-full max-w-md space-y-4">
        <Link href="/finops" className="text-sm text-muted-foreground hover:underline">
          ← FinOps
        </Link>
        <h1 className="text-xl font-bold">Transactions</h1>
        <TransactionsList initialRows={transactions ?? []} />
      </div>
    </main>
  );
}
