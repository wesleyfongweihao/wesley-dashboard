import Link from "next/link";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function FinOpsHomePage() {
  return (
    <main className="min-h-dvh bg-muted/30 px-4 py-6">
      <div className="mx-auto w-full max-w-md space-y-4">
        <div>
          <Link href="/" className="text-sm text-muted-foreground hover:underline">
            ← Home
          </Link>
          <h1 className="text-2xl font-bold">FinOps</h1>
          <p className="text-sm text-muted-foreground">Finance Operations</p>
        </div>

        <Link href="/finops/add">
          <Card className="cursor-pointer transition-colors hover:bg-muted/50">
            <CardHeader>
              <CardTitle>Add Transaction</CardTitle>
              <CardDescription>Log a new expense</CardDescription>
            </CardHeader>
          </Card>
        </Link>

        <Link href="/finops/transactions">
          <Card className="cursor-pointer transition-colors hover:bg-muted/50">
            <CardHeader>
              <CardTitle>Transactions</CardTitle>
              <CardDescription>View, edit, and delete entries</CardDescription>
            </CardHeader>
          </Card>
        </Link>
      </div>
    </main>
  );
}
