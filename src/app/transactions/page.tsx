import { supabase } from "@/lib/supabase";

type Transaction = {
  id: string;
  txn_date: string;
  payment_method: string;
  mode: string;
  category: string;
  description: string;
  amount: number;
  week_ending: string;
  created_at: string;
};

export default async function TransactionsPage() {
  const { data: transactions, error } = await supabase
    .from("transactions")
    .select("*")
    .order("txn_date", { ascending: false })
    .returns<Transaction[]>();

  if (error) {
    return (
      <main className="p-8">
        <p className="text-red-600">Failed to load transactions: {error.message}</p>
      </main>
    );
  }

  const total = (transactions ?? []).reduce((sum, t) => sum + t.amount, 0);

  return (
    <main className="p-8">
      <h1 className="text-xl font-bold mb-2">Transactions</h1>
      <p className="mb-4">
        Total spend: <span className="font-semibold">${total.toFixed(2)}</span>
      </p>

      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b text-left">
            <th className="p-2">Date</th>
            <th className="p-2">Category</th>
            <th className="p-2">Description</th>
            <th className="p-2 text-right">Amount</th>
          </tr>
        </thead>
        <tbody>
          {(transactions ?? []).map((t) => (
            <tr key={t.id} className="border-b">
              <td className="p-2">{t.txn_date}</td>
              <td className="p-2">{t.category}</td>
              <td className="p-2">{t.description}</td>
              <td className="p-2 text-right">${t.amount.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}
