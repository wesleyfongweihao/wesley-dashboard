"use client";

import { useState } from "react";
import Link from "next/link";
import { Pencil, Trash2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import type { TransactionRow } from "@/components/transaction-form";

export function TransactionsList({ initialRows }: { initialRows: TransactionRow[] }) {
  const [rows, setRows] = useState(initialRows);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleDelete(id: string) {
    setDeletingId(id);
    const { error } = await supabase.from("transactions").delete().eq("id", id);
    setDeletingId(null);
    if (!error) {
      setRows((prev) => prev.filter((r) => r.id !== id));
    }
  }

  if (rows.length === 0) {
    return <p className="text-sm text-muted-foreground">No transactions yet.</p>;
  }

  return (
    <div className="space-y-3">
      {rows.map((row) => (
        <div key={row.id} className="space-y-2 rounded-lg border p-3">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{row.txn_date}</span>
            <span>{row.payment_method}</span>
          </div>
          <div>
            <div className="font-medium">{row.category}</div>
            <div className="text-sm text-muted-foreground">{row.description}</div>
          </div>
          <div className="flex items-center justify-between pt-1">
            <span className="text-lg font-semibold">${row.amount.toFixed(2)}</span>
            <div className="flex items-center gap-2">
              <Button
                size="icon"
                variant="outline"
                className="size-9"
                nativeButton={false}
                render={<Link href={`/finops/edit/${row.id}`} aria-label="Edit transaction" />}
              >
                <Pencil className="size-4" />
              </Button>
              <AlertDialog>
                <AlertDialogTrigger
                  render={
                    <Button
                      size="icon"
                      variant="destructive"
                      className="size-9"
                      aria-label="Delete transaction"
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  }
                />
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete transaction?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently delete &quot;{row.description}&quot; (${row.amount.toFixed(2)}). This
                      cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => handleDelete(row.id)}
                      disabled={deletingId === row.id}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      {deletingId === row.id ? "Deleting..." : "Delete"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
