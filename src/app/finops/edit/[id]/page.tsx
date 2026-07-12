import { supabase } from "@/lib/supabase";
import { TransactionForm, type TransactionRow } from "@/components/transaction-form";

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

  return <TransactionForm formMode="edit" transactionId={id} initialRow={row} />;
}
