"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toDateString } from "@/lib/dates";
import { formatModeShort, formatPaymentMethodShort } from "@/lib/format";
import { getCategoryConfig, deriveSubOption } from "@/lib/category-config";
import {
  FLEX_CATEGORIES,
  FIXED_ITEMS,
  MODES,
  PAYMENT_METHODS,
  type Mode,
  type PaymentMethod,
  type TransactionRow,
} from "@/lib/finops-shared";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { PageHeader } from "@/components/finops/page-header";
import { Amount } from "@/components/finops/amount";

type DateChoice = "yesterday" | "today" | "custom";

function deriveInitialState(row: TransactionRow) {
  const today = new Date();
  const todayStr = toDateString(today);
  const yesterdayStr = toDateString(
    new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1)
  );

  const dateChoice: DateChoice =
    row.txn_date === todayStr ? "today" : row.txn_date === yesterdayStr ? "yesterday" : "custom";

  return {
    dateChoice,
    customDate: dateChoice === "custom" ? row.txn_date : "",
    paymentMethod: row.payment_method as PaymentMethod,
    mode: row.mode as Mode,
    category: row.category,
    subOption: deriveSubOption(row.category, row.description),
    amount: String(row.amount),
    description:
      getCategoryConfig(row.category).type === "picker"
        ? deriveSubOption(row.category, row.description) === "Others"
          ? row.description
          : ""
        : row.description,
  };
}

export function TransactionEditor({
  formMode,
  initialRow,
}: {
  formMode: "create" | "edit";
  initialRow?: TransactionRow;
}) {
  const router = useRouter();
  const isEdit = formMode === "edit";
  const initial = isEdit && initialRow ? deriveInitialState(initialRow) : null;

  const today = new Date();
  const todayStr = toDateString(today);
  const yesterdayStr = toDateString(
    new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1)
  );

  const [dateChoice, setDateChoice] = useState<DateChoice>(initial?.dateChoice ?? "today");
  const [customDate, setCustomDate] = useState(initial?.customDate ?? "");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(
    initial?.paymentMethod ?? null
  );
  const [mode, setMode] = useState<Mode | null>(initial?.mode ?? null);
  const [category, setCategory] = useState<string | null>(initial?.category ?? null);
  const [subOption, setSubOption] = useState<string | null>(initial?.subOption ?? null);
  const [amount, setAmount] = useState(initial?.amount ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [confirmedCount, setConfirmedCount] = useState(0);
  const [lastConfirmed, setLastConfirmed] = useState<{
    amount: number;
    category: string;
  } | null>(null);

  const txnDate =
    dateChoice === "yesterday"
      ? yesterdayStr
      : dateChoice === "today"
      ? todayStr
      : customDate || todayStr;

  const categoryOptions =
    mode === "Flex" ? FLEX_CATEGORIES : mode === "Fixed" ? FIXED_ITEMS : null;

  const parsedAmount = parseFloat(amount);
  const canSubmit =
    paymentMethod !== null &&
    mode !== null &&
    (mode === "Big Amount" || category !== null) &&
    !isNaN(parsedAmount) &&
    parsedAmount > 0 &&
    !submitting;

  function handleCategorySelect(item: string) {
    setCategory(item);
    setSubOption(null);

    const config = getCategoryConfig(item);
    if (config.type === "locked") {
      setAmount(String(config.amount));
      setDescription(item);
    } else if (config.type === "picker") {
      setDescription("");
    }
  }

  function handleSubOptionSelect(value: string) {
    setSubOption(value);
    setDescription(value === "Others" ? "" : value);
  }

  async function handleSubmit() {
    if (!canSubmit || !paymentMethod || !mode) return;

    const categoryToSave = mode === "Big Amount" ? "Others" : category ?? "";

    setSubmitting(true);
    setSubmitError(null);

    const payload = {
      txn_date: txnDate,
      payment_method: paymentMethod,
      mode,
      category: categoryToSave,
      description: description.trim(),
      amount: parsedAmount,
    };

    if (isEdit && initialRow) {
      const { error } = await supabase
        .from("transactions")
        .update(payload)
        .eq("id", initialRow.id);

      setSubmitting(false);
      if (error) {
        setSubmitError(error.message);
        return;
      }
      router.push("/finops");
      return;
    }

    const { error } = await supabase.from("transactions").insert([payload]);
    setSubmitting(false);

    if (error) {
      setSubmitError(error.message);
      return;
    }

    const newCount = confirmedCount + 1;
    setConfirmedCount(newCount);
    if (newCount >= 2) {
      setLastConfirmed({ amount: parsedAmount, category: categoryToSave });
    }

    setAmount("");
    setCategory(null);
    setSubOption(null);
    setDescription("");
  }

  async function handleDelete() {
    if (!initialRow) return;
    setDeleting(true);
    const { error } = await supabase.from("transactions").delete().eq("id", initialRow.id);
    setDeleting(false);
    if (error) {
      setSubmitError(error.message);
      return;
    }
    router.push("/finops");
  }

  return (
    <main className="min-h-dvh bg-background pb-10">
      <PageHeader title={isEdit ? "Edit transaction" : "Add spend"} />

      <div className="mx-auto w-full max-w-md space-y-5 px-4 pt-5">
        {lastConfirmed && (
          <div className="flex items-center gap-2 rounded-xl bg-emerald-500/10 px-3 py-2 text-sm font-medium text-emerald-600">
            <Check className="size-4 shrink-0" />
            <span>
              <Amount value={lastConfirmed.amount} size={13} className="inline-flex" />{" "}
              {lastConfirmed.category} confirmed. Ready for next.
            </span>
          </div>
        )}

        {/* Amount */}
        <Card>
          <CardContent className="flex items-center justify-center gap-1 py-6">
            <span className="text-2xl font-medium text-muted-foreground">$</span>
            <input
              type="number"
              inputMode="decimal"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="w-32 bg-transparent text-center text-4xl font-medium outline-none placeholder:text-muted-foreground/40"
            />
          </CardContent>
        </Card>

        {/* Date */}
        <section className="space-y-1.5">
          <p className="text-[11px] font-medium text-muted-foreground">Date</p>
          <div className="grid grid-cols-3 gap-2">
            <Button
              type="button"
              variant={dateChoice === "yesterday" ? "default" : "outline"}
              className="h-10 text-sm"
              onClick={() => setDateChoice("yesterday")}
            >
              Yesterday
            </Button>
            <Button
              type="button"
              variant={dateChoice === "today" ? "default" : "outline"}
              className="h-10 text-sm"
              onClick={() => setDateChoice("today")}
            >
              Today
            </Button>
            <Button
              type="button"
              variant={dateChoice === "custom" ? "default" : "outline"}
              className="h-10 text-sm"
              onClick={() => setDateChoice("custom")}
            >
              Choose
            </Button>
          </div>
          {dateChoice === "custom" && (
            <Input
              type="date"
              value={customDate || todayStr}
              onChange={(e) => setCustomDate(e.target.value)}
              className="h-10 text-sm"
            />
          )}
        </section>

        {/* Payment method */}
        <section className="space-y-1.5">
          <p className="text-[11px] font-medium text-muted-foreground">Payment method</p>
          <div className="grid grid-cols-3 gap-2">
            {PAYMENT_METHODS.map((pm) => (
              <Button
                key={pm}
                type="button"
                variant={paymentMethod === pm ? "default" : "outline"}
                className="h-10 text-sm"
                onClick={() => setPaymentMethod(pm)}
              >
                {formatPaymentMethodShort(pm)}
              </Button>
            ))}
          </div>
        </section>

        {/* Mode */}
        <section className="space-y-1.5">
          <p className="text-[11px] font-medium text-muted-foreground">Mode</p>
          <div className="grid grid-cols-3 gap-2">
            {MODES.map((m) => (
              <Button
                key={m}
                type="button"
                variant={mode === m ? "default" : "outline"}
                className="h-10 text-sm"
                onClick={() => {
                  setMode(m);
                  setCategory(m === "Big Amount" ? "Others" : null);
                  setSubOption(null);
                }}
              >
                {formatModeShort(m)}
              </Button>
            ))}
          </div>
        </section>

        {/* Category — auto-assigned for Big Amount, since there's only one option */}
        {mode === "Big Amount" && (
          <section className="space-y-1.5">
            <p className="text-[11px] font-medium text-muted-foreground">Category</p>
            <div className="flex h-10 items-center rounded-md border border-input bg-muted/40 px-3 text-sm text-muted-foreground">
              Others (auto-assigned)
            </div>
          </section>
        )}

        {categoryOptions && (
          <section className="space-y-1.5">
            <p className="text-[11px] font-medium text-muted-foreground">Category</p>
            <div className="grid grid-cols-2 gap-2">
              {categoryOptions.map((item) => (
                <Button
                  key={item}
                  type="button"
                  variant={category === item ? "default" : "outline"}
                  className="h-10 text-sm"
                  onClick={() => handleCategorySelect(item)}
                >
                  {item}
                </Button>
              ))}
            </div>
          </section>
        )}

        {/* Category sub-picker */}
        {category &&
          (() => {
            const config = getCategoryConfig(category);
            if (config.type !== "picker") return null;
            return (
              <section className="space-y-1.5">
                <p className="text-[11px] font-medium text-muted-foreground">{config.label}</p>
                <Select
                  value={subOption}
                  onValueChange={(v) => v && handleSubOptionSelect(v)}
                >
                  <SelectTrigger className="h-10 w-full text-sm">
                    <SelectValue placeholder="Choose" />
                  </SelectTrigger>
                  <SelectContent>
                    {config.options.map((opt) => (
                      <SelectItem key={opt} value={opt} className="text-sm">
                        {opt}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </section>
            );
          })()}

        {/* Description */}
        <section className="space-y-1.5">
          <p className="text-[11px] font-medium text-muted-foreground">Description</p>
          <Input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Add a note (optional)"
            className="h-10 text-sm"
          />
        </section>

        {submitError && <p className="text-sm text-destructive">{submitError}</p>}

        <Button
          type="button"
          variant="default"
          className="h-11 w-full text-base font-medium"
          disabled={!canSubmit}
          onClick={handleSubmit}
        >
          {submitting ? "Saving..." : isEdit ? "Update" : "Save"}
        </Button>

        {isEdit && initialRow && (
          <AlertDialog>
            <AlertDialogTrigger
              render={
                <Button variant="destructive" className="h-11 w-full text-sm font-medium">
                  Delete transaction
                </Button>
              }
            />
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete transaction?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete &quot;{initialRow.description}&quot; ($
                  {initialRow.amount.toFixed(2)}). This cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  disabled={deleting}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {deleting ? "Deleting..." : "Delete"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>
    </main>
  );
}
