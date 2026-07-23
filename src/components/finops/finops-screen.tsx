"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ChevronDown, Menu } from "lucide-react";
import { formatFirstCap, formatPaymentMethodShort, formatShortDay } from "@/lib/format";
import { getCategoryIcon } from "@/lib/category-icons";
import { getModeTone } from "@/lib/mode-colors";
import { getTopCategory, groupByDay } from "@/lib/finops-aggregate";
import type { TransactionRow } from "@/lib/finops-shared";
import { Card, CardContent } from "@/components/ui/card";
import { Amount } from "@/components/finops/amount";
import { Sparkline } from "@/components/finops/sparkline";

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
  monthTotal,
  monthTransactionCount,
  fourWeekTotals,
}: {
  weekRows: TransactionRow[];
  weekTotal: number;
  monthTotal: number;
  monthTransactionCount: number;
  fourWeekTotals: number[];
}) {
  const greeting = useGreeting();

  const dayGroups = useMemo(() => groupByDay(weekRows), [weekRows]);
  const topCategory = useMemo(() => getTopCategory(weekRows), [weekRows]);

  const topCategorySparkline = useMemo(() => {
    if (!topCategory) return [];
    return dayGroups
      .slice()
      .reverse()
      .map((day) =>
        day.rows
          .filter((r) => r.category === topCategory.category)
          .reduce((sum, r) => sum + r.amount, 0)
      );
  }, [dayGroups, topCategory]);

  const avg4Week =
    fourWeekTotals.length > 0
      ? fourWeekTotals.reduce((sum, v) => sum + v, 0) / fourWeekTotals.length
      : 0;
  const currentWeekVsAvg = weekTotal - avg4Week;
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
          <h1 className="text-center text-lg font-medium">Money</h1>
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
            <div className="flex items-center justify-between px-4 py-4">
              <div>
                <p className="text-base font-medium">This week</p>
                <p className="text-xs text-muted-foreground">
                  {weekRows.length} transaction{weekRows.length === 1 ? "" : "s"}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Amount value={weekTotal} size={16} />
                <ChevronDown className="size-4 text-muted-foreground" />
              </div>
            </div>
            <div className="flex items-center justify-between px-4 py-4">
              <div>
                <p className="text-base font-medium">This month</p>
                <p className="text-xs text-muted-foreground">
                  {monthTransactionCount} transaction{monthTransactionCount === 1 ? "" : "s"}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Amount value={monthTotal} size={16} />
                <ChevronDown className="size-4 text-muted-foreground" />
              </div>
            </div>
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
                  4-WEEK AVG
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

        {/* Transaction list */}
        <div className="space-y-4">
          {dayGroups.length === 0 ? (
            <p className="text-sm text-muted-foreground">No transactions this week.</p>
          ) : (
            dayGroups.map((day) => (
              <div key={day.date} className="space-y-2">
                <div className="flex items-center justify-between text-[13px] text-muted-foreground">
                  <span>{formatShortDay(day.date)}</span>
                  <Amount value={day.total} size={13} />
                </div>
                <Card className="p-0">
                  <div className="divide-y divide-border">
                    {day.rows.map((row) => {
                      const Icon = getCategoryIcon(row.category);
                      const tone = getModeTone(row.mode);
                      const subtext = row.description.trim()
                        ? `${formatPaymentMethodShort(row.payment_method)} · ${formatFirstCap(
                            row.description.trim()
                          )}`
                        : formatPaymentMethodShort(row.payment_method);
                      return (
                        <Link
                          key={row.id}
                          href={`/finops/edit/${row.id}`}
                          className="flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-muted/50"
                        >
                          <span
                            className="flex size-9 shrink-0 items-center justify-center rounded-full"
                            style={{ backgroundColor: tone.bg, color: tone.fg }}
                          >
                            <Icon className="size-4" />
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium">{row.category}</p>
                            <p className="truncate text-xs text-muted-foreground">{subtext}</p>
                          </div>
                          <Amount value={row.amount} size={15} />
                        </Link>
                      );
                    })}
                  </div>
                </Card>
              </div>
            ))
          )}
        </div>
      </div>
    </main>
  );
}
