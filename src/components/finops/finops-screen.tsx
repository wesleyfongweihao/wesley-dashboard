"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Menu } from "lucide-react";
import { formatDateShort, formatShortDay, formatWeekEndingShort } from "@/lib/format";
import { getModeTone } from "@/lib/mode-colors";
import { getTopCategory, groupByDay } from "@/lib/finops-aggregate";
import {
  GROCERY_WEEK_COLORS,
  MONTHLY_GROCERY_BUDGET,
  WEEKLY_POCKET_BUDGET,
  getPocketSpent,
  getWeeklyTotals,
} from "@/lib/finops-budget";
import type { TransactionRow } from "@/lib/finops-shared";
import { Card, CardContent } from "@/components/ui/card";
import { Amount } from "@/components/finops/amount";
import { BudgetCard } from "@/components/finops/budget-card";
import { Sparkline } from "@/components/finops/sparkline";
import { MonieLogo } from "@/components/finops/logo";
import { TransactionRowCard } from "@/components/finops/transaction-row-card";
import { HEADER_GRADIENT } from "@/components/finops/page-header";

function useGreeting() {
  const [greeting, setGreeting] = useState<string | null>(null);
  useEffect(() => {
    const hour = new Date().getHours();
    setGreeting(hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening");
  }, []);
  return greeting;
}

export function FinOpsScreen({
  weekRows,
  groceryMonthRows,
  groceryMonthLabel,
  fourWeekTotals,
  pocketWeekEndings,
  pocketWeeklyTotals,
  recentRows,
}: {
  weekRows: TransactionRow[];
  groceryMonthRows: { amount: number; week_ending: string }[];
  groceryMonthLabel: string;
  fourWeekTotals: number[];
  pocketWeekEndings: string[];
  pocketWeeklyTotals: number[];
  recentRows: TransactionRow[];
}) {
  const greeting = useGreeting();

  const weekDayGroups = useMemo(() => groupByDay(weekRows), [weekRows]);
  const listDayGroups = useMemo(() => groupByDay(recentRows), [recentRows]);
  const topCategory = useMemo(() => getTopCategory(weekRows), [weekRows]);

  const pocketSpent = useMemo(() => getPocketSpent(weekRows), [weekRows]);
  const pocketTrend = pocketWeekEndings.map((weekEnding, i) => ({
    label: formatDateShort(weekEnding),
    amount: pocketWeeklyTotals[i] ?? 0,
  }));

  const groceryWeeklyTotals = useMemo(() => getWeeklyTotals(groceryMonthRows), [groceryMonthRows]);
  const grocerySpent = useMemo(
    () => groceryWeeklyTotals.reduce((sum, w) => sum + w.amount, 0),
    [groceryWeeklyTotals]
  );
  const grocerySegments = groceryWeeklyTotals.map((w, i) => ({
    key: w.weekEnding,
    label: formatWeekEndingShort(w.weekEnding),
    amount: w.amount,
    color: GROCERY_WEEK_COLORS[Math.min(i, GROCERY_WEEK_COLORS.length - 1)],
  }));

  const flexTone = getModeTone("Flex");
  const fixedTone = getModeTone("Fixed");

  const topCategorySparkline = useMemo(() => {
    if (!topCategory) return [];
    return weekDayGroups
      .slice()
      .reverse()
      .map((day) =>
        day.rows
          .filter((r) => r.category === topCategory.category)
          .reduce((sum, r) => sum + r.amount, 0)
      );
  }, [weekDayGroups, topCategory]);

  const weekFlexTotal = useMemo(
    () => weekRows.filter((r) => r.mode === "Flex").reduce((sum, r) => sum + r.amount, 0),
    [weekRows]
  );

  const avg4Week =
    fourWeekTotals.length > 0
      ? fourWeekTotals.reduce((sum, v) => sum + v, 0) / fourWeekTotals.length
      : 0;
  const currentWeekVsAvg = weekFlexTotal - avg4Week;
  const isBelowAvg = currentWeekVsAvg <= 0;

  return (
    <main className="min-h-dvh bg-background pb-10">
      {/* Header */}
      <div className="rounded-b-3xl px-4 pb-8 pt-6 text-white" style={{ background: HEADER_GRADIENT }}>
        <div className="grid grid-cols-[2.25rem_1fr_2.25rem] items-center">
          <button
            type="button"
            aria-label="Menu"
            className="flex size-9 items-center justify-center rounded-md hover:bg-white/10"
          >
            <Menu className="size-5" />
          </button>
          <div className="flex items-center justify-center">
            <MonieLogo />
          </div>
          <div />
        </div>

        <p className="mt-4 text-center text-[21px] font-medium">
          {greeting ?? "Hello"}, Wesley
        </p>

        <div className="mt-5 flex justify-center">
          <Link
            href="/finops/add"
            className="rounded-full px-5 py-2.5 text-sm font-medium text-white"
            style={{ background: "rgba(255,255,255,0.25)" }}
          >
            Add spend →
          </Link>
        </div>
      </div>

      <div className="mx-auto w-full max-w-md space-y-6 px-4 pt-6">
        {/* Budgets */}
        <div className="space-y-3">
          <BudgetCard
            title="Pocket this week"
            budget={WEEKLY_POCKET_BUDGET}
            spent={pocketSpent}
            accentColor={flexTone.fg}
            trackColor={flexTone.bg}
            trend={pocketTrend}
          />
          <BudgetCard
            title={`Grocery in ${groceryMonthLabel}`}
            budget={MONTHLY_GROCERY_BUDGET}
            spent={grocerySpent}
            accentColor={fixedTone.fg}
            trackColor={fixedTone.bg}
            segments={grocerySegments}
            remainderLabel="Left"
          />
        </div>

        {/* Spending insights */}
        <div>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium">Spending insights</h2>
            <Link href="/finops/dashboard" className="text-sm text-muted-foreground">
              View dashboard ›
            </Link>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-3">
            <Card className="rounded-[12px]">
              <CardContent className="space-y-2 p-3.5">
                <p className="text-[11px] font-medium tracking-[0.05em] text-muted-foreground">
                  TOP CATEGORY
                </p>
                {topCategory ? (
                  <>
                    <Amount value={topCategory.amount} size={19} />
                    <p className="text-xs text-amber-600">
                      {topCategory.category} · {topCategory.percentOfTotal}% of week
                    </p>
                    <Sparkline values={topCategorySparkline} color="#F59E0B" />
                  </>
                ) : (
                  <p className="text-xs text-muted-foreground">No spending yet</p>
                )}
              </CardContent>
            </Card>

            <Card className="rounded-[12px]">
              <CardContent className="space-y-2 p-3.5">
                <p className="text-[11px] font-medium tracking-[0.05em] text-muted-foreground">
                  4-WEEK AVG · FLEX
                </p>
                <Amount value={avg4Week} size={19} />
                <p className={isBelowAvg ? "text-xs text-emerald-600" : "text-xs text-amber-600"}>
                  {isBelowAvg ? "↓" : "↑"} <Amount value={Math.abs(currentWeekVsAvg)} size={12} />{" "}
                  vs this week
                </p>
                <Sparkline values={fourWeekTotals} color="#00A3DA" />
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Transaction list — last 14 days */}
        <div className="space-y-4">
          {listDayGroups.length === 0 ? (
            <p className="text-sm text-muted-foreground">No transactions in the last 14 days.</p>
          ) : (
            listDayGroups.map((day) => (
              <div key={day.date} className="space-y-2">
                <div className="flex items-center justify-between text-[13px] text-muted-foreground">
                  <span>{formatShortDay(day.date)}</span>
                  <Amount value={day.total} size={13} />
                </div>
                <TransactionRowCard rows={day.rows} />
              </div>
            ))
          )}
        </div>
      </div>
    </main>
  );
}
