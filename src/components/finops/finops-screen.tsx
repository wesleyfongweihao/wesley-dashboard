"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ChevronDown, Menu } from "lucide-react";
import { formatShortDay } from "@/lib/format";
import { getModeTone, type ModeKey } from "@/lib/mode-colors";
import { getModeTotals, getTopCategory, groupByDay } from "@/lib/finops-aggregate";
import type { TransactionRow } from "@/lib/finops-shared";
import { Card, CardContent } from "@/components/ui/card";
import { Amount } from "@/components/finops/amount";
import { Sparkline } from "@/components/finops/sparkline";
import { MonieLogo } from "@/components/finops/logo";
import { TransactionRowCard } from "@/components/finops/transaction-row-card";

const GRADIENT = "linear-gradient(165deg, #00A3DA 0%, #00B2E2 55%, #2AC4EC 100%)";

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
  weekTotal,
  monthRows,
  monthTotal,
  monthTransactionCount,
  fourWeekTotals,
  recentRows,
}: {
  weekRows: TransactionRow[];
  weekTotal: number;
  monthRows: { amount: number; mode: string }[];
  monthTotal: number;
  monthTransactionCount: number;
  fourWeekTotals: number[];
  recentRows: TransactionRow[];
}) {
  const greeting = useGreeting();
  const [expanded, setExpanded] = useState<"week" | "month" | null>(null);

  const weekDayGroups = useMemo(() => groupByDay(weekRows), [weekRows]);
  const listDayGroups = useMemo(() => groupByDay(recentRows), [recentRows]);
  const topCategory = useMemo(() => getTopCategory(weekRows), [weekRows]);
  const weekModeTotals = useMemo(() => getModeTotals(weekRows), [weekRows]);
  const monthModeTotals = useMemo(() => getModeTotals(monthRows), [monthRows]);

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
      <div className="rounded-b-3xl px-4 pb-8 pt-6 text-white" style={{ background: GRADIENT }}>
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
        {/* Summary card */}
        <Card>
          <CardContent className="divide-y divide-border p-0">
            <button
              type="button"
              onClick={() => setExpanded(expanded === "week" ? null : "week")}
              className="flex w-full items-center justify-between px-4 py-4 text-left"
            >
              <div>
                <p className="text-base font-medium">This week</p>
                <p className="text-xs text-muted-foreground">
                  {weekRows.length} transaction{weekRows.length === 1 ? "" : "s"}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Amount value={weekTotal} size={16} />
                <ChevronDown
                  className={`size-4 text-muted-foreground transition-transform ${
                    expanded === "week" ? "rotate-180" : ""
                  }`}
                />
              </div>
            </button>
            {expanded === "week" && <ModeBreakdown totals={weekModeTotals} />}

            <button
              type="button"
              onClick={() => setExpanded(expanded === "month" ? null : "month")}
              className="flex w-full items-center justify-between px-4 py-4 text-left"
            >
              <div>
                <p className="text-base font-medium">This month</p>
                <p className="text-xs text-muted-foreground">
                  {monthTransactionCount} transaction{monthTransactionCount === 1 ? "" : "s"}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Amount value={monthTotal} size={16} />
                <ChevronDown
                  className={`size-4 text-muted-foreground transition-transform ${
                    expanded === "month" ? "rotate-180" : ""
                  }`}
                />
              </div>
            </button>
            {expanded === "month" && <ModeBreakdown totals={monthModeTotals} />}
          </CardContent>
        </Card>

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

function ModeBreakdown({ totals }: { totals: { mode: ModeKey; amount: number }[] }) {
  return (
    <div className="space-y-2.5 bg-muted/30 px-4 py-3.5">
      {totals.map((t) => {
        const tone = getModeTone(t.mode);
        return (
          <div key={t.mode} className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-sm">
              <span className="size-2 rounded-full" style={{ backgroundColor: tone.fg }} />
              {t.mode}
            </span>
            <Amount value={t.amount} size={13} />
          </div>
        );
      })}
    </div>
  );
}
