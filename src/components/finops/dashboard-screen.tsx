"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { PageHeader } from "@/components/finops/page-header";
import { Amount } from "@/components/finops/amount";
import { formatMonthAbbr } from "@/lib/dates";
import { getModeTone } from "@/lib/mode-colors";
import type { TransactionRow } from "@/lib/finops-shared";
import {
  MODE_FILTERS,
  matchesModeFilter,
  type CalendarDay,
  type ModeFilter,
  type YearMonthTotal,
} from "@/lib/finops-calendar";

const WEEKDAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const HIGH_SPEND_MULTIPLIER = 1.5;
const CORAL_BG = "#FAECE7";
const CORAL_TEXT = "#993C1D";

type DashboardScreenProps =
  | {
      view: "month";
      monthKey: string;
      monthLabel: string;
      prevHref: string;
      nextHref: string | null;
      rows: TransactionRow[];
      prevMonthRows: { amount: number; mode: string }[];
      calendarDays: CalendarDay[];
      yearViewHref: string;
    }
  | {
      view: "year";
      year: number;
      prevYearHref: string;
      nextYearHref: string | null;
      monthTotals: YearMonthTotal[];
      monthViewHref: string;
    };

export function DashboardScreen(props: DashboardScreenProps) {
  return (
    <main className="min-h-dvh bg-background pb-10">
      <PageHeader title="Dashboard" showLogo />

      <div className="mx-auto w-full max-w-md space-y-6 px-4 pt-6">
        <ViewTabs
          active={props.view}
          monthHref={props.view === "year" ? props.monthViewHref : undefined}
          yearHref={props.view === "month" ? props.yearViewHref : undefined}
        />

        {props.view === "month" ? <MonthView {...props} /> : <YearView {...props} />}
      </div>
    </main>
  );
}

function ViewTabs({
  active,
  monthHref,
  yearHref,
}: {
  active: "month" | "year";
  monthHref?: string;
  yearHref?: string;
}) {
  return (
    <div className="flex gap-2">
      {active === "month" ? (
        <span className="flex-1 rounded-full bg-primary py-1.5 text-center text-sm font-medium text-primary-foreground">
          Month
        </span>
      ) : (
        <Link
          href={monthHref!}
          className="flex-1 rounded-full py-1.5 text-center text-sm font-medium text-muted-foreground hover:bg-muted"
        >
          Month
        </Link>
      )}
      {active === "year" ? (
        <span className="flex-1 rounded-full bg-primary py-1.5 text-center text-sm font-medium text-primary-foreground">
          Year
        </span>
      ) : (
        <Link
          href={yearHref!}
          className="flex-1 rounded-full py-1.5 text-center text-sm font-medium text-muted-foreground hover:bg-muted"
        >
          Year
        </Link>
      )}
    </div>
  );
}

function MonthView({
  monthKey,
  monthLabel,
  prevHref,
  nextHref,
  rows,
  prevMonthRows,
  calendarDays,
}: Extract<DashboardScreenProps, { view: "month" }>) {
  const [modeFilter, setModeFilter] = useState<ModeFilter>("All");

  const filteredRows = useMemo(
    () => rows.filter((r) => matchesModeFilter(r.mode, modeFilter)),
    [rows, modeFilter]
  );

  const dailyTotals = useMemo(() => {
    const map = new Map<string, number>();
    for (const row of filteredRows) {
      map.set(row.txn_date, (map.get(row.txn_date) ?? 0) + row.amount);
    }
    return map;
  }, [filteredRows]);

  const monthTotal = useMemo(
    () => filteredRows.reduce((sum, r) => sum + r.amount, 0),
    [filteredRows]
  );

  const prevMonthTotal = useMemo(
    () =>
      prevMonthRows
        .filter((r) => matchesModeFilter(r.mode, modeFilter))
        .reduce((sum, r) => sum + r.amount, 0),
    [prevMonthRows, modeFilter]
  );

  const trendDiff = monthTotal - prevMonthTotal;
  const isUp = trendDiff > 0;

  const highSpendThreshold = useMemo(() => {
    const spendDays = calendarDays
      .map((day) => dailyTotals.get(day.date) ?? 0)
      .filter((total) => total > 0);
    if (spendDays.length === 0) return null;
    const mean = spendDays.reduce((sum, v) => sum + v, 0) / spendDays.length;
    return mean * HIGH_SPEND_MULTIPLIER;
  }, [calendarDays, dailyTotals]);

  return (
    <>
      {/* Mode filter toggle */}
      <div className="flex rounded-full border border-border bg-muted/30 p-1">
        {MODE_FILTERS.map((filter) => (
          <button
            key={filter}
            type="button"
            onClick={() => setModeFilter(filter)}
            className={`flex-1 rounded-full py-1.5 text-sm font-medium transition-colors ${
              modeFilter === filter
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground"
            }`}
          >
            {filter}
          </button>
        ))}
      </div>

      {/* Month navigation */}
      <div className="text-center">
        <div className="flex items-center justify-center gap-4">
          <Link
            href={prevHref}
            aria-label="Previous month"
            className="flex size-8 items-center justify-center rounded-full hover:bg-muted"
          >
            <ChevronLeft className="size-5 text-muted-foreground" />
          </Link>
          <p className="text-sm font-medium text-muted-foreground">{monthLabel}</p>
          {nextHref ? (
            <Link
              href={nextHref}
              aria-label="Next month"
              className="flex size-8 items-center justify-center rounded-full hover:bg-muted"
            >
              <ChevronRight className="size-5 text-muted-foreground" />
            </Link>
          ) : (
            <span className="flex size-8 items-center justify-center">
              <ChevronRight className="size-5 text-muted-foreground/30" />
            </span>
          )}
        </div>
        <div className="mt-2 flex items-center justify-center gap-2">
          <Amount value={monthTotal} size={28} className="text-primary" />
          {trendDiff !== 0 && (
            <span
              className={`inline-flex items-center gap-0.5 text-xs font-medium ${
                isUp ? "text-amber-600" : "text-emerald-600"
              }`}
            >
              {isUp ? "↑" : "↓"}
              <Amount value={Math.abs(trendDiff)} size={11} />
            </span>
          )}
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          Total spend
          {trendDiff !== 0 && " vs last month"}
        </p>
      </div>

      {/* Calendar grid */}
      <div>
        <div className="grid grid-cols-7 gap-1 text-center text-[11px] tracking-wide text-muted-foreground">
          {WEEKDAY_LABELS.map((label) => (
            <div key={label}>{label}</div>
          ))}
        </div>

        <div className="mt-1 grid grid-cols-7 gap-1">
          {calendarDays.map((day) => {
            const total = dailyTotals.get(day.date) ?? 0;
            const hasTxn = !day.isFuture && total > 0;
            const highSpend = hasTxn && highSpendThreshold !== null && total > highSpendThreshold;
            const dayNumber = Number(day.date.slice(8, 10));

            const cellClasses = [
              "flex aspect-square flex-col items-center justify-center gap-0.5 rounded-[10px] text-center",
              day.isToday ? "border-[1.5px] border-primary" : "border border-transparent",
            ].join(" ");

            const dateColor = day.isFuture
              ? "text-muted-foreground/30"
              : day.isToday
                ? "text-primary"
                : !day.inMonth
                  ? "text-muted-foreground/40"
                  : "text-foreground";

            const inner = (
              <>
                <span className={`text-xs font-medium ${dateColor}`}>{dayNumber}</span>
                {day.isFuture ? null : hasTxn ? (
                  <Amount
                    value={total}
                    size={10}
                    className={
                      highSpend ? "font-medium text-[#993C1D]" : "font-medium text-muted-foreground"
                    }
                  />
                ) : (
                  <span className="text-[10px] text-muted-foreground/50">—</span>
                )}
              </>
            );

            const style = highSpend ? { backgroundColor: CORAL_BG } : undefined;

            return hasTxn ? (
              <Link
                key={day.date}
                href={`/finops/dashboard/day/${day.date}?month=${monthKey}`}
                className={cellClasses}
                style={style}
              >
                {inner}
              </Link>
            ) : (
              <div key={day.date} className={cellClasses} style={style}>
                {inner}
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span
              className="size-3 rounded-full"
              style={{ backgroundColor: CORAL_BG, border: `1px solid ${CORAL_TEXT}` }}
            />
            High spend
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-3 rounded-full border-[1.5px] border-primary" />
            Today
          </span>
        </div>
      </div>
    </>
  );
}

function YearView({
  year,
  prevYearHref,
  nextYearHref,
  monthTotals,
}: Extract<DashboardScreenProps, { view: "year" }>) {
  return (
    <>
      {/* Year navigation */}
      <div className="flex items-center justify-center gap-4">
        <Link
          href={prevYearHref}
          aria-label="Previous year"
          className="flex size-8 items-center justify-center rounded-full hover:bg-muted"
        >
          <ChevronLeft className="size-5 text-muted-foreground" />
        </Link>
        <p className="text-sm font-medium text-muted-foreground">{year}</p>
        {nextYearHref ? (
          <Link
            href={nextYearHref}
            aria-label="Next year"
            className="flex size-8 items-center justify-center rounded-full hover:bg-muted"
          >
            <ChevronRight className="size-5 text-muted-foreground" />
          </Link>
        ) : (
          <span className="flex size-8 items-center justify-center">
            <ChevronRight className="size-5 text-muted-foreground/30" />
          </span>
        )}
      </div>

      {/* Month grid */}
      <div className="grid grid-cols-3 gap-3">
        {monthTotals.map((m) => (
          <div key={m.monthKey} className="space-y-2 rounded-[12px] border border-border p-3">
            <div className="flex items-center justify-between gap-1">
              <p className="text-xs font-medium text-muted-foreground">
                {formatMonthAbbr(m.monthKey)}
              </p>
              {m.weekCount === 5 && (
                <span className="text-[9px] text-muted-foreground/70">5 wks</span>
              )}
            </div>
            {m.total > 0 ? (
              <Amount value={m.total} size={16} />
            ) : (
              <span className="text-sm text-muted-foreground/50">—</span>
            )}
            <div className="space-y-1 pt-1">
              {m.modeTotals.map((mt) => (
                <div
                  key={mt.mode}
                  className="flex items-center justify-between gap-1 text-[10px] text-muted-foreground"
                >
                  <span className="flex items-center gap-1">
                    <span
                      className="size-1.5 shrink-0 rounded-full"
                      style={{ backgroundColor: getModeTone(mt.mode).fg }}
                    />
                    {mt.mode === "Big Amount" ? "Big" : mt.mode}
                  </span>
                  <Amount value={mt.amount} size={10} />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
