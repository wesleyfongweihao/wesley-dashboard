"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toDateString } from "@/lib/dates";
import { formatAmountValue, formatModeShort, formatPaymentMethodShort } from "@/lib/format";
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
  FLEX_CATEGORIES,
  FIXED_ITEMS,
  MODES,
  PAYMENT_METHODS,
  type TransactionRow,
} from "@/components/transaction-form";
import { getCategoryConfig } from "@/lib/category-config";

type PaymentMethod = (typeof PAYMENT_METHODS)[number];
type Mode = (typeof MODES)[number];
type DateChoice = "yesterday" | "today" | "custom";

function formatAmountRM(amount: number): string {
  return `RM ${formatAmountValue(amount)}`;
}

export function AddTransactionSheet({
  onConfirm,
  onClose,
}: {
  onConfirm: (row: TransactionRow) => void;
  onClose: () => void;
}) {
  const today = new Date();
  const todayStr = toDateString(today);
  const yesterdayStr = toDateString(
    new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1)
  );

  const [dateChoice, setDateChoice] = useState<DateChoice>("today");
  const [customDate, setCustomDate] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null);
  const [mode, setMode] = useState<Mode | null>(null);
  const [category, setCategory] = useState<string | null>(null);
  const [subOption, setSubOption] = useState<string | null>(null);
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
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
  const canConfirm =
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

  async function handleConfirm() {
    if (!canConfirm || !paymentMethod || !mode) return;

    const categoryToSave = mode === "Big Amount" ? "Others" : category ?? "";

    setSubmitting(true);
    setSubmitError(null);

    const { data, error } = await supabase
      .from("transactions")
      .insert([
        {
          txn_date: txnDate,
          payment_method: paymentMethod,
          mode,
          category: categoryToSave,
          description: description.trim(),
          amount: parsedAmount,
        },
      ])
      .select()
      .single<TransactionRow>();

    setSubmitting(false);

    if (error) {
      setSubmitError(error.message);
      return;
    }

    onConfirm(data);

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

  return (
    <div className="space-y-5">
      {/* Drag handle + title */}
      <div className="space-y-3">
        <div className="mx-auto h-1.5 w-10 rounded-full bg-muted" />
        <h2 className="text-center text-base font-semibold">Add Transaction</h2>
      </div>

      {/* Success strip */}
      {lastConfirmed && (
        <div className="flex items-center gap-2 rounded-lg bg-emerald-500/10 px-3 py-2 text-sm font-medium text-emerald-600 dark:text-emerald-400">
          <Check className="size-4 shrink-0" />
          <span>
            {formatAmountRM(lastConfirmed.amount)} {lastConfirmed.category} Confirmed.
            Ready For Next.
          </span>
        </div>
      )}

      {/* Amount */}
      <Card>
        <CardContent className="flex items-center justify-center gap-2 py-6">
          <span className="text-2xl font-semibold text-muted-foreground">RM</span>
          <input
            type="number"
            inputMode="decimal"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            className="w-32 bg-transparent text-center text-4xl font-bold outline-none placeholder:text-muted-foreground/40"
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

      {/* Payment Method */}
      <section className="space-y-1.5">
        <p className="text-[11px] font-medium text-muted-foreground">Payment Method</p>
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
                setCategory(null);
                setSubOption(null);
              }}
            >
              {formatModeShort(m)}
            </Button>
          ))}
        </div>
      </section>

      {/* Category */}
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

      {/* Category sub-picker (Subscription/Grocery/Sport/Transport) */}
      {category &&
        (() => {
          const config = getCategoryConfig(category);
          if (config.type !== "picker") return null;
          return (
            <section className="space-y-1.5">
              <p className="text-[11px] font-medium text-muted-foreground">
                {config.label}
              </p>
              <Select value={subOption} onValueChange={(v) => v && handleSubOptionSelect(v)}>
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

      {/* Cancel / Confirm */}
      <div className="flex gap-2 pt-1">
        <Button
          type="button"
          variant="secondary"
          className="h-11 flex-1 text-sm font-semibold"
          onClick={onClose}
        >
          Cancel
        </Button>
        <Button
          type="button"
          variant="default"
          className="h-11 flex-[2] text-base font-semibold"
          disabled={!canConfirm}
          onClick={handleConfirm}
        >
          {submitting ? "Saving..." : "Confirm"}
        </Button>
      </div>
    </div>
  );
}
