import { supabase } from "@/lib/supabase";
import { TransactionEditor } from "@/components/finops/transaction-editor";
import type { TransactionRow } from "@/lib/finops-shared";

export const dynamic = "force-dynamic";

export default async function EditTransactionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const { data: row, error } = await supabase
    .from("transactions")
    .select("*")
    .eq("id", id)
    .single<TransactionRow>();

  if (error || !row) {
    return (
      <main className="min-h-dvh bg-muted/30 px-4 py-6">
        <p className="text-destructive">Transaction not found.</p>
      </main>
    );
  }

  return <TransactionEditor formMode="edit" initialRow={row} />;
}
