"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { toDateString } from "@/lib/dates";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type PaymentMethod = "QR" | "CC" | "Cash";
type Mode = "Fixed" | "Flex" | "Big Amount";

export const PAYMENT_METHODS: PaymentMethod[] = ["QR", "CC", "Cash"];
export const MODES: Mode[] = ["Fixed", "Flex", "Big Amount"];

export const FLEX_CATEGORIES = [
  "Food",
  "Shop",
  "Transport",
  "Sport",
  "Fruits",
  "Entertainment",
  "Events",
  "Others",
] as const;

const TRANSPORT_ITEMS = [
  "Grab",
  "Indriver",
  "Maxim",
  "Taxi",
  "Bus",
  "Bolt",
  "Fuel Oil Car",
  "Others",
] as const;

const SPORT_ITEMS = [
  "Badminton",
  "Badminton Equipment",
  "Golf",
  "Gym",
  "Pickle Ball",
  "Running",
  "Hike",
  "Others",
] as const;

export const FIXED_ITEMS = [
  "TNG 50",
  "Apple phone",
  "Insurance",
  "Rental",
  "Hair",
  "Grocery",
  "Subscription",
] as const;

export const LOCKED_FIXED_AMOUNTS: Record<string, number> = {
  "TNG 50": 50,
  "Apple phone": 133.31,
  Insurance: 220,
  Rental: 350,
  Hair: 31,
};

const GROCERY_ITEMS = [
  "Farm Fresh",
  "Jobbie",
  "Greek Yogurt",
  "Granola",
  "Blueberry",
  "Almond",
  "Others",
] as const;

const SUBSCRIPTION_ITEMS = [
  "The Edge News",
  "Chat GPT",
  "Claude",
  "Habbit App",
  "The Futurists",
  "YouTube",
  "Grab Unlimited",
  "Others",
] as const;

export type TransactionRow = {
  id: number;
  txn_date: string;
  payment_method: string;
  mode: string;
  category: string;
  description: string;
  amount: number;
  week_ending: string;
};

function deriveFieldsFromRow(row: TransactionRow) {
  const txnMode = row.mode as Mode;

  let category: string | null = null;
  let transportItem: string | null = null;
  let sportItem: string | null = null;
  let fixedItem: string | null = null;
  let groceryItem: string | null = null;
  let subscriptionItem: string | null = null;

  if (txnMode === "Flex") {
    category = row.category;
    if (category === "Transport") {
      const namedItems: readonly string[] = TRANSPORT_ITEMS;
      transportItem =
        namedItems.includes(row.description) && row.description !== "Others"
          ? row.description
          : "Others";
    } else if (category === "Sport") {
      const namedItems: readonly string[] = SPORT_ITEMS;
      sportItem =
        namedItems.includes(row.description) && row.description !== "Others"
          ? row.description
          : "Others";
    }
  } else if (txnMode === "Fixed") {
    fixedItem = row.category;
    if (fixedItem === "Grocery") {
      const namedItems: readonly string[] = GROCERY_ITEMS;
      groceryItem =
        namedItems.includes(row.description) && row.description !== "Others"
          ? row.description
          : "Others";
    } else if (fixedItem === "Subscription") {
      const namedItems: readonly string[] = SUBSCRIPTION_ITEMS;
      subscriptionItem =
        namedItems.includes(row.description) && row.description !== "Others"
          ? row.description
          : "Others";
    }
  }

  return {
    txnDate: row.txn_date,
    paymentMethod: row.payment_method as PaymentMethod,
    mode: txnMode,
    category,
    description: row.description,
    amount: String(row.amount),
    transportItem,
    sportItem,
    fixedItem,
    groceryItem,
    subscriptionItem,
  };
}

export function TransactionForm({
  formMode,
  transactionId,
  initialRow,
  onSuccess,
  onCancel,
}: {
  formMode: "create" | "edit";
  transactionId?: number;
  initialRow?: TransactionRow;
  onSuccess?: (row: TransactionRow) => void;
  onCancel?: () => void;
}) {
  const isEdit = formMode === "edit";
  const initial = isEdit && initialRow ? deriveFieldsFromRow(initialRow) : null;

  const today = new Date();
  const todayStr = toDateString(today);
  const yesterdayStr = toDateString(
    new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1)
  );
  const tomorrowStr = toDateString(
    new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1)
  );

  const [txnDate, setTxnDate] = useState<string>(initial?.txnDate ?? "");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(
    initial?.paymentMethod ?? null
  );
  const [mode, setMode] = useState<Mode | null>(initial?.mode ?? null);

  const [category, setCategory] = useState<string | null>(initial?.category ?? null);
  const [description, setDescription] = useState<string>(initial?.description ?? "");
  const [amount, setAmount] = useState<string>(initial?.amount ?? "");

  const [transportItem, setTransportItem] = useState<string | null>(
    initial?.transportItem ?? null
  );
  const [sportItem, setSportItem] = useState<string | null>(initial?.sportItem ?? null);

  const [fixedItem, setFixedItem] = useState<string | null>(initial?.fixedItem ?? null);
  const [groceryItem, setGroceryItem] = useState<string | null>(
    initial?.groceryItem ?? null
  );
  const [subscriptionItem, setSubscriptionItem] = useState<string | null>(
    initial?.subscriptionItem ?? null
  );

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);

  function resetAfterMode() {
    setCategory(null);
    setDescription("");
    setAmount("");
    setTransportItem(null);
    setSportItem(null);
    setFixedItem(null);
    setGroceryItem(null);
    setSubscriptionItem(null);
    setSubmitError(null);
    setSubmitSuccess(null);
  }

  function handleModeSelect(m: string) {
    setMode(m as Mode);
    resetAfterMode();
  }

  function handleFlexCategorySelect(c: string) {
    setCategory(c);
    setTransportItem(null);
    setSportItem(null);
    setDescription("");
    setAmount("");
    setSubmitError(null);
    setSubmitSuccess(null);
  }

  function handleTransportItemSelect(item: string) {
    setTransportItem(item);
    setAmount("");
    setSubmitError(null);
    setSubmitSuccess(null);
    setDescription(item === "Others" ? "" : item);
  }

  function handleSportItemSelect(item: string) {
    setSportItem(item);
    setAmount("");
    setSubmitError(null);
    setSubmitSuccess(null);
    setDescription(item === "Others" ? "" : item);
  }

  function handleFixedItemSelect(item: string) {
    setFixedItem(item);
    setGroceryItem(null);
    setSubscriptionItem(null);
    setSubmitError(null);
    setSubmitSuccess(null);

    if (item in LOCKED_FIXED_AMOUNTS) {
      setCategory(item);
      setDescription(item);
      setAmount(String(LOCKED_FIXED_AMOUNTS[item]));
    } else if (item === "Grocery") {
      setCategory("Grocery");
      setDescription("");
      setAmount("");
    } else if (item === "Subscription") {
      setCategory("Subscription");
      setDescription("");
      setAmount("");
    }
  }

  function handleGroceryItemSelect(item: string) {
    setGroceryItem(item);
    setAmount("");
    setSubmitError(null);
    setSubmitSuccess(null);
    setDescription(item === "Others" ? "" : item);
  }

  function handleSubscriptionItemSelect(item: string) {
    setSubscriptionItem(item);
    setAmount("");
    setSubmitError(null);
    setSubmitSuccess(null);
    setDescription(item === "Others" ? "" : item);
  }

  async function submitTransaction(fields: {
    category: string;
    description: string;
    amount: number;
  }) {
    setSubmitting(true);
    setSubmitError(null);

    const payload = {
      txn_date: txnDate,
      payment_method: paymentMethod,
      mode: mode,
      category: fields.category,
      description: fields.description,
      amount: fields.amount,
    };

    if (isEdit && transactionId) {
      const { data, error } = await supabase
        .from("transactions")
        .update(payload)
        .eq("id", transactionId)
        .select()
        .single<TransactionRow>();

      setSubmitting(false);

      if (error) {
        setSubmitError(error.message);
      } else {
        onSuccess?.(data);
      }
      return;
    }

    const { data, error } = await supabase
      .from("transactions")
      .insert([payload])
      .select()
      .single<TransactionRow>();

    setSubmitting(false);

    if (error) {
      setSubmitError(error.message);
    } else {
      setSubmitSuccess(`Added: ${fields.description} - $${fields.amount.toFixed(2)}`);
      onSuccess?.(data);
    }
  }

  function handleManualSubmit() {
    const parsedAmount = parseFloat(amount);
    if (!description.trim() || isNaN(parsedAmount) || parsedAmount <= 0) return;
    void submitTransaction({
      category: category ?? "",
      description: description.trim(),
      amount: parsedAmount,
    });
  }

  function startNewEntry() {
    setPaymentMethod(null);
    setMode(null);
    resetAfterMode();
  }

  function singleToggleHandler(setValue: (v: string) => void) {
    return (values: string[]) => {
      if (values.length > 0) setValue(values[values.length - 1]);
    };
  }

  const parsedAmount = parseFloat(amount);
  const amountValid = !isNaN(parsedAmount) && parsedAmount > 0;

  const showFlexFreeDescription =
    mode === "Flex" && category !== null && category !== "Transport" && category !== "Sport";

  const showFlexAmount =
    mode === "Flex" &&
    category !== null &&
    (category === "Transport"
      ? transportItem !== null && (transportItem !== "Others" || description.trim() !== "")
      : category === "Sport"
      ? sportItem !== null && (sportItem !== "Others" || description.trim() !== "")
      : description.trim() !== "");

  const showBigAmountDescription = mode === "Big Amount";
  const showBigAmountAmount = showBigAmountDescription && description.trim() !== "";

  const showGroceryDescription =
    fixedItem === "Grocery" && groceryItem === "Others";
  const showGroceryAmount =
    fixedItem === "Grocery" &&
    groceryItem !== null &&
    (groceryItem !== "Others" || description.trim() !== "");

  const showSubscriptionAmount =
    fixedItem === "Subscription" &&
    subscriptionItem !== null &&
    (subscriptionItem !== "Others" || description.trim() !== "");

  const showLockedFixedSave = fixedItem !== null && fixedItem in LOCKED_FIXED_AMOUNTS;

  const showManualSubmit =
    showFlexAmount ||
    showBigAmountAmount ||
    showGroceryAmount ||
    showSubscriptionAmount ||
    showLockedFixedSave;

  return (
    <div className="space-y-6">
      {/* Date */}
      <section className="space-y-2">
        <Label>Date</Label>
        <div className="grid grid-cols-3 gap-2">
          <Button
            type="button"
            variant={txnDate === yesterdayStr ? "default" : "outline"}
            className="h-11 text-base"
            onClick={() => setTxnDate(yesterdayStr)}
          >
            Yesterday
          </Button>
          <Button
            type="button"
            variant={txnDate === todayStr ? "default" : "outline"}
            className="h-11 text-base"
            onClick={() => setTxnDate(todayStr)}
          >
            Today
          </Button>
          <Button
            type="button"
            variant={txnDate === tomorrowStr ? "default" : "outline"}
            className="h-11 text-base"
            onClick={() => setTxnDate(tomorrowStr)}
          >
            Tomorrow
          </Button>
        </div>
        <Input
          type="date"
          value={txnDate}
          onChange={(e) => setTxnDate(e.target.value)}
          className="h-11 text-base"
        />
      </section>

      {/* Payment Method */}
      {txnDate && (
        <section className="space-y-2">
          <Label>Payment Method</Label>
          <ToggleGroup
            variant="outline"
            spacing={2}
            value={paymentMethod ? [paymentMethod] : []}
            onValueChange={singleToggleHandler((v) =>
              setPaymentMethod(v as PaymentMethod)
            )}
            className="w-full grid grid-cols-3"
          >
            {PAYMENT_METHODS.map((pm) => (
              <ToggleGroupItem
                key={pm}
                value={pm}
                className="h-11 text-base data-pressed:bg-primary data-pressed:text-primary-foreground"
              >
                {pm}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </section>
      )}

      {/* Mode */}
      {txnDate && paymentMethod && (
        <section className="space-y-2">
          <Label>Mode</Label>
          <ToggleGroup
            variant="outline"
            spacing={2}
            value={mode ? [mode] : []}
            onValueChange={singleToggleHandler(handleModeSelect)}
            className="w-full grid grid-cols-3"
          >
            {MODES.map((m) => (
              <ToggleGroupItem
                key={m}
                value={m}
                className="h-11 text-base data-pressed:bg-primary data-pressed:text-primary-foreground"
              >
                {m}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </section>
      )}

      {/* Flex branch */}
      {mode === "Flex" && (
        <section className="space-y-2">
          <Label>Category</Label>
          <Select
            value={category}
            onValueChange={(v) => v && handleFlexCategorySelect(v)}
          >
            <SelectTrigger className="h-12 w-full text-base">
              <SelectValue placeholder="Choose category" />
            </SelectTrigger>
            <SelectContent>
              {FLEX_CATEGORIES.map((c) => (
                <SelectItem key={c} value={c} className="py-2.5 text-base">
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </section>
      )}

      {category === "Transport" && (
        <section className="space-y-2">
          <Label>Item</Label>
          <Select
            value={transportItem}
            onValueChange={(v) => v && handleTransportItemSelect(v)}
          >
            <SelectTrigger className="h-12 w-full text-base">
              <SelectValue placeholder="Choose item" />
            </SelectTrigger>
            <SelectContent>
              {TRANSPORT_ITEMS.map((item) => (
                <SelectItem key={item} value={item} className="py-2.5 text-base">
                  {item}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </section>
      )}

      {category === "Sport" && (
        <section className="space-y-2">
          <Label>Item</Label>
          <Select
            value={sportItem}
            onValueChange={(v) => v && handleSportItemSelect(v)}
          >
            <SelectTrigger className="h-12 w-full text-base">
              <SelectValue placeholder="Choose item" />
            </SelectTrigger>
            <SelectContent>
              {SPORT_ITEMS.map((item) => (
                <SelectItem key={item} value={item} className="py-2.5 text-base">
                  {item}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </section>
      )}

      {(showFlexFreeDescription ||
        (category === "Transport" && transportItem === "Others") ||
        (category === "Sport" && sportItem === "Others")) && (
        <section className="space-y-2">
          <Label>Description</Label>
          <Input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="h-12 text-base"
            placeholder="What was it?"
          />
        </section>
      )}

      {/* Big Amount branch */}
      {showBigAmountDescription && (
        <section className="space-y-2">
          <Label>Description</Label>
          <Input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="h-12 text-base"
            placeholder="What was it?"
          />
        </section>
      )}

      {/* Fixed branch */}
      {mode === "Fixed" && (
        <section className="space-y-2">
          <Label>Item</Label>
          <Select
            value={fixedItem}
            onValueChange={(v) => v && handleFixedItemSelect(v)}
          >
            <SelectTrigger className="h-12 w-full text-base">
              <SelectValue placeholder="Choose item" />
            </SelectTrigger>
            <SelectContent>
              {FIXED_ITEMS.map((item) => (
                <SelectItem key={item} value={item} className="py-2.5 text-base">
                  {item}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </section>
      )}

      {fixedItem === "Grocery" && (
        <section className="space-y-2">
          <Label>Item</Label>
          <Select
            value={groceryItem}
            onValueChange={(v) => v && handleGroceryItemSelect(v)}
          >
            <SelectTrigger className="h-12 w-full text-base">
              <SelectValue placeholder="Choose item" />
            </SelectTrigger>
            <SelectContent>
              {GROCERY_ITEMS.map((item) => (
                <SelectItem key={item} value={item} className="py-2.5 text-base">
                  {item}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </section>
      )}

      {showGroceryDescription && (
        <section className="space-y-2">
          <Label>Description</Label>
          <Input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="h-12 text-base"
            placeholder="What was it?"
          />
        </section>
      )}

      {fixedItem === "Subscription" && (
        <section className="space-y-2">
          <Label>Subscription</Label>
          <Select
            value={subscriptionItem}
            onValueChange={(v) => v && handleSubscriptionItemSelect(v)}
          >
            <SelectTrigger className="h-12 w-full text-base">
              <SelectValue placeholder="Choose subscription" />
            </SelectTrigger>
            <SelectContent>
              {SUBSCRIPTION_ITEMS.map((item) => (
                <SelectItem key={item} value={item} className="py-2.5 text-base">
                  {item}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </section>
      )}

      {fixedItem === "Subscription" && subscriptionItem === "Others" && (
        <section className="space-y-2">
          <Label>Description</Label>
          <Input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="h-12 text-base"
            placeholder="What was it?"
          />
        </section>
      )}

      {/* Amount + submit for all manual-entry paths */}
      {(showFlexAmount ||
        showBigAmountAmount ||
        showGroceryAmount ||
        showSubscriptionAmount ||
        showLockedFixedSave) && (
        <section className="space-y-2">
          <Label>Amount</Label>
          <Input
            type="number"
            inputMode="decimal"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="h-12 text-base"
            placeholder="0.00"
          />
        </section>
      )}

      {showManualSubmit && (
        <Button
          type="button"
          onClick={handleManualSubmit}
          disabled={!amountValid || submitting}
          className="h-12 w-full text-base font-semibold"
        >
          {submitting ? "Saving..." : isEdit ? "Save Changes" : "Submit"}
        </Button>
      )}

      {submitError && <p className="text-sm text-destructive">{submitError}</p>}

      {submitSuccess && (
        <div className="space-y-3 rounded-lg border border-primary/30 bg-primary/5 p-4">
          <p className="text-sm font-medium text-primary">{submitSuccess}</p>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={startNewEntry}
              className="h-11 flex-1 text-base font-semibold"
            >
              Add another
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              className="h-11 flex-1 text-base font-semibold"
            >
              Done
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
