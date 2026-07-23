"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Menu, Plus } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import { addWeeks, getWeekRange, parseDateString } from "@/lib/dates";
import {
  formatDDMmmYYYY,
  formatDayLabel,
  formatFirstCap,
  formatModeShort,
  formatPaymentMethodShort,
  formatRm,
} from "@/lib/format";
import {
  MODE_ORDER,
  getCategoryColor,
  getContrastText,
  getModeColor,
} from "@/lib/mode-colors";
import { getCategoryTotals, getModeTotals, groupByDay } from "@/lib/finops-aggregate";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CurrencyAmount } from "@/components/finops/currency-amount";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { TransactionForm, type TransactionRow } from "@/components/transaction-form";
import { SpendDonut } from "@/components/finops/spend-donut";
import { AddTransactionSheet } from "@/components/finops/add-transaction-sheet";

export function FinOpsScreen({
  initialWeekEnding,
  initialRows,
}: {
  initialWeekEnding: string;
  initialRows: TransactionRow[];
}) {
  const currentWeekEnding = getWeekRange(new Date()).weekEnding;

  const [selectedWeekEnding, setSelectedWeekEnding] = useState(initialWeekEnding);
  const [rows, setRows] = useState<TransactionRow[]>(initialRows);
  const [loading, setLoading] = useState(false);
  const [editingRow, setEditingRow] = useState<TransactionRow | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  async function fetchWeek(weekEndingStr: string) {
    const { weekStart } = getWeekRange(parseDateString(weekEndingStr));
    const { data, error } = await supabase
      .from("transactions")
      .select("*")
      .gte("txn_date", weekStart)
      .lte("txn_date", weekEndingStr)
      .gte("amount", 0)
      .order("txn_date", { ascending: false })
      .order("created_at", { ascending: true })
      .returns<TransactionRow[]>();
    if (!error) setRows(data ?? []);
  }

  async function goToWeek(weekEndingStr: string) {
    setSelectedWeekEnding(weekEndingStr);
    setLoading(true);
    await fetchWeek(weekEndingStr);
    setLoading(false);
  }

  function handlePrevWeek() {
    void goToWeek(addWeeks(selectedWeekEnding, -1));
  }

  function handleNextWeek() {
    if (selectedWeekEnding === currentWeekEnding) return;
    void goToWeek(addWeeks(selectedWeekEnding, 1));
  }

  async function handleDelete(id: number) {
    setDeletingId(id);
    const { error } = await supabase.from("transactions").delete().eq("id", id);
    setDeletingId(null);
    if (!error) {
      setEditingRow(null);
      setRows((prev) => prev.filter((r) => r.id !== id));
    }
  }

  function handleCreateSuccess(row: TransactionRow) {
    if (row.week_ending === selectedWeekEnding) {
      setRows((prev) => [row, ...prev]);
    }
  }

  function handleEditSuccess(row: TransactionRow) {
    setEditingRow(null);
    if (row.week_ending === selectedWeekEnding) {
      setRows((prev) => prev.map((r) => (r.id === row.id ? row : r)));
    } else {
      setRows((prev) => prev.filter((r) => r.id !== row.id));
    }
  }

  const modeTotals = useMemo(() => getModeTotals(rows), [rows]);
  const categoryTotals = useMemo(() => getCategoryTotals(rows), [rows]);
  const dayGroups = useMemo(() => groupByDay(rows), [rows]);
  const isCurrentWeek = selectedWeekEnding === currentWeekEnding;

  return (
    <main className="min-h-dvh bg-muted/30 px-4 py-6 pb-28">
      <div className="mx-auto w-full max-w-md space-y-6">
        {/* Header */}
        <div className="grid grid-cols-[2.25rem_1fr_2.25rem] items-center">
          <Link
            href="/"
            aria-label="Home"
            className="flex size-9 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <Menu className="size-5" />
          </Link>
          <h1 className="text-center text-lg font-semibold">FinOps</h1>
          <div />
        </div>

        {/* Summary card */}
        <Card>
          <CardContent
            className={cn(
              "space-y-4 transition-opacity",
              loading && "pointer-events-none opacity-50"
            )}
          >
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">
                Total Spend · Week {formatDDMmmYYYY(selectedWeekEnding)}
              </p>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8"
                  onClick={handlePrevWeek}
                  aria-label="Previous week"
                >
                  <ChevronLeft className="size-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8"
                  onClick={handleNextWeek}
                  disabled={isCurrentWeek}
                  aria-label="Next week"
                >
                  <ChevronRight className="size-4" />
                </Button>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <SpendDonut categoryTotals={categoryTotals} />
              <div className="min-w-0 flex-1 space-y-2">
                {MODE_ORDER.map((m) => (
                  <div key={m} className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2">
                      <span
                        className="size-3 shrink-0 rounded-sm"
                        style={{ backgroundColor: getModeColor(m) }}
                      />
                      {formatModeShort(m)}
                    </span>
                    <CurrencyAmount amount={modeTotals[m]} className="font-medium" />
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {categoryTotals.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  No spending this week yet.
                </p>
              ) : (
                categoryTotals.map((c) => (
                  <span
                    key={`${c.mode}::${c.category}`}
                    className="flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-xs"
                  >
                    <span
                      className="size-2.5 shrink-0 rounded-sm"
                      style={{ backgroundColor: getCategoryColor(c.mode, c.category) }}
                    />
                    {c.category} <CurrencyAmount amount={c.amount} />
                  </span>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Transaction list, grouped by day */}
        <div
          className={cn(
            "space-y-4 transition-opacity",
            loading && "pointer-events-none opacity-50"
          )}
        >
          {dayGroups.length === 0 ? (
            <p className="text-sm text-muted-foreground">No transactions this week.</p>
          ) : (
            dayGroups.map((day) => (
              <div key={day.date} className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">{formatDayLabel(day.date)}</p>
                  <CurrencyAmount
                    amount={day.total}
                    className="text-xs text-muted-foreground"
                  />
                </div>
                <div className="space-y-2">
                  {day.rows.map((row) => {
                    const modeColor = getModeColor(row.mode);
                    const subtext = row.description.trim()
                      ? `${formatPaymentMethodShort(row.payment_method)} · ${formatFirstCap(
                          row.description.trim()
                        )}`
                      : formatPaymentMethodShort(row.payment_method);
                    return (
                      <Card key={row.id} className="overflow-hidden p-0">
                        <button
                          type="button"
                          onClick={() => setEditingRow(row)}
                          className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/50"
                        >
                          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-black text-xs font-semibold text-white">
                            {row.category.charAt(0).toUpperCase()}
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium">
                              {row.category}
                            </p>
                            <p className="truncate text-xs text-muted-foreground">
                              {subtext}
                            </p>
                          </div>
                          <div className="flex shrink-0 flex-col items-end gap-1">
                            <span
                              className="rounded-full px-2 py-0.5 text-[11px] font-medium"
                              style={{
                                backgroundColor: modeColor,
                                color: getContrastText(modeColor),
                              }}
                            >
                              {formatModeShort(row.mode)}
                            </span>
                            <CurrencyAmount
                              amount={row.amount}
                              className="text-sm font-semibold"
                            />
                          </div>
                        </button>
                      </Card>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Add transaction FAB */}
      <Button
        size="icon"
        className="fixed bottom-6 right-6 z-40 size-14 rounded-full shadow-lg"
        onClick={() => setAddOpen(true)}
        aria-label="Add transaction"
      >
        <Plus className="size-6" />
      </Button>

      {/* Add dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent showClose={false}>
          <AddTransactionSheet
            key={addOpen ? "add-open" : "add-closed"}
            onConfirm={handleCreateSuccess}
            onClose={() => setAddOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Edit dialog */}
      <Dialog
        open={editingRow !== null}
        onOpenChange={(open) => {
          if (!open) setEditingRow(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Transaction</DialogTitle>
          </DialogHeader>
          {editingRow && (
            <>
              <TransactionForm
                key={editingRow.id}
                formMode="edit"
                transactionId={editingRow.id}
                initialRow={editingRow}
                onSuccess={handleEditSuccess}
                onCancel={() => setEditingRow(null)}
              />
              <AlertDialog>
                <AlertDialogTrigger
                  render={
                    <Button variant="destructive" className="w-full">
                      Delete transaction
                    </Button>
                  }
                />
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete transaction?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently delete &quot;{editingRow.description}&quot;
                      ({formatRm(editingRow.amount)}). This cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => handleDelete(editingRow.id)}
                      disabled={deletingId === editingRow.id}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      {deletingId === editingRow.id ? "Deleting..." : "Delete"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </>
          )}
        </DialogContent>
      </Dialog>
    </main>
  );
}
