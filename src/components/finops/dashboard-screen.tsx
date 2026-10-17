"use client";

import { Fragment, useMemo, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { PageHeader } from "@/components/finops/page-header";
import { Amount } from "@/components/finops/amount";
import { SpendDonut } from "@/components/finops/spend-donut";
import { formatMonthAbbr, getWeekRangeLabel } from "@/lib/dates";
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
const GREEN_BG = "#E8F6EE";
const GREEN_TEXT = "#0F6E56";
const GRAY_BG = "#EFEFEF";
const GRAY_TEXT = "#5B5B5B";
/** A month is "high"/"low" once it's this many times above/below the mean;
 * anything in between reads as "average". */
const SPEND_BAND_MULTIPLIER = 1.15;

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

  // Calendar days split into Mon–Sun weeks, each with its week_ending (the
  // Sunday) and that week's total for the selected mode filter.
  const weeks = useMemo(() => {
    const totalByWeekEnding = new Map<string, number>();
    for (const row of filteredRows) {
      totalByWeekEnding.set(
        row.week_ending,
        (totalByWeekEnding.get(row.week_ending) ?? 0) + row.amount
      );
    }
    const result: { weekEnding: string; days: CalendarDay[]; total: number; hasToday: boolean }[] =
      [];
    for (let i = 0; i < calendarDays.length; i += 7) {
      const days = calendarDays.slice(i, i + 7);
      const weekEnding = days[days.length - 1].date;
      result.push({
        weekEnding,
        days,
        total: totalByWeekEnding.get(weekEnding) ?? 0,
        hasToday: days.some((d) => d.isToday),
      });
    }
    return result;
  }, [calendarDays, filteredRows]);
  const maxWeekTotal = Math.max(0, ...weeks.map((w) => w.total));

  // Tapping a week narrows "Where it went" to that week; tapping it again
  // (or changing month) goes back to the whole month.
  const [selectedWeekEnding, setSelectedWeekEnding] = useState<string | null>(null);
  const selectedWeekIndex = weeks.findIndex((w) => w.weekEnding === selectedWeekEnding);
  const donutRows = useMemo(
    () =>
      selectedWeekIndex === -1
        ? filteredRows
        : filteredRows.filter((r) => r.week_ending === selectedWeekEnding),
    [filteredRows, selectedWeekEnding, selectedWeekIndex]
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
          {weeks.map((week) => (
            <Fragment key={week.weekEnding}>
          {week.days.map((day) => {
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
            </Fragment>
          ))}
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

      {/* Weekly totals — bar length is relative to the biggest week */}
      <section className="space-y-3">
        <div className="flex items-baseline justify-between">
          <p className="text-sm font-medium text-muted-foreground">By week</p>
          <p className="text-xs text-muted-foreground/70">Tap a week to see where it went</p>
        </div>
        <div className="space-y-1">
          {weeks.map((week, i) => {
            const barPercent = maxWeekTotal > 0 ? (week.total / maxWeekTotal) * 100 : 0;
            const selected = i === selectedWeekIndex;
            return (
              <button
                type="button"
                key={week.weekEnding}
                aria-pressed={selected}
                onClick={() => setSelectedWeekEnding(selected ? null : week.weekEnding)}
                className={`block w-full space-y-1.5 rounded-xl px-3 py-2.5 text-left transition-colors ${
                  selected ? "bg-primary/10 ring-1 ring-primary" : "hover:bg-muted/50"
                }`}
              >
                <div className="flex items-baseline justify-between gap-3">
                  <span className="flex items-baseline gap-2">
                    <span
                      className={`text-sm font-medium ${
                        week.hasToday ? "text-primary" : "text-foreground"
                      }`}
                    >
                      Week {i + 1}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {getWeekRangeLabel(week.weekEnding)}
                    </span>
                  </span>
                  {week.total > 0 ? (
                    <Amount
                      value={week.total}
                      size={17}
                      className={week.hasToday ? "text-primary" : "text-foreground"}
                    />
                  ) : (
                    <span className="text-sm text-muted-foreground/50">—</span>
                  )}
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-muted/60">
                  <div
                    className={`h-full rounded-full ${
                      week.hasToday ? "bg-primary" : "bg-primary/35"
                    }`}
                    style={{ width: `${barPercent}%` }}
                  />
                </div>
              </button>
            );
          })}
        </div>
      </section>

      <SpendDonut
        rows={donutRows}
        filter={modeFilter}
        title={selectedWeekIndex === -1 ? "Where it went · Whole month" : `Where it went · Week ${selectedWeekIndex + 1}`}
      />
    </>
  );
}

function YearView({
  year,
  prevYearHref,
  nextYearHref,
  monthTotals,
}: Extract<DashboardScreenProps, { view: "year" }>) {
  const tierByMonth = useMemo(() => {
    const spendTotals = monthTotals.map((m) => m.total).filter((total) => total > 0);
    const map = new Map<string, "high" | "average" | "low">();
    if (spendTotals.length === 0) return map;
    const mean = spendTotals.reduce((sum, v) => sum + v, 0) / spendTotals.length;
    for (const m of monthTotals) {
      if (m.total <= 0) continue;
      if (m.total > mean * SPEND_BAND_MULTIPLIER) map.set(m.monthKey, "high");
      else if (m.total < mean / SPEND_BAND_MULTIPLIER) map.set(m.monthKey, "low");
      else map.set(m.monthKey, "average");
    }
    return map;
  }, [monthTotals]);
  const hasAnySpend = tierByMonth.size > 0;

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
        {monthTotals.map((m) => {
          const tier = tierByMonth.get(m.monthKey);
          const cellStyle =
            tier === "high"
              ? { backgroundColor: CORAL_BG, borderColor: CORAL_TEXT }
              : tier === "low"
                ? { backgroundColor: GREEN_BG, borderColor: GREEN_TEXT }
                : tier === "average"
                  ? { backgroundColor: GRAY_BG, borderColor: GRAY_TEXT }
                  : undefined;
          const amountClass =
            tier === "high"
              ? "text-[#993C1D]"
              : tier === "low"
                ? "text-[#0F6E56]"
                : tier === "average"
                  ? "text-[#5B5B5B]"
                  : undefined;

          return (
            <div
              key={m.monthKey}
              className="space-y-2 rounded-[12px] border p-3"
              style={cellStyle}
            >
              <div className="flex items-center justify-between gap-1">
                <p className="text-xs font-medium text-muted-foreground">
                  {formatMonthAbbr(m.monthKey)}
                </p>
                {m.weekCount === 5 && (
                  <span className="text-[9px] text-muted-foreground/70">5 wks</span>
                )}
              </div>
              {m.total > 0 ? (
                <Amount value={m.total} size={16} className={amountClass} />
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
          );
        })}
      </div>

      {/* Legend */}
      {hasAnySpend && (
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span
              className="size-3 rounded-full"
              style={{ backgroundColor: CORAL_BG, border: `1px solid ${CORAL_TEXT}` }}
            />
            High spend
          </span>
          <span className="flex items-center gap-1.5">
            <span
              className="size-3 rounded-full"
              style={{ backgroundColor: GRAY_BG, border: `1px solid ${GRAY_TEXT}` }}
            />
            Average
          </span>
          <span className="flex items-center gap-1.5">
            <span
              className="size-3 rounded-full"
              style={{ backgroundColor: GREEN_BG, border: `1px solid ${GREEN_TEXT}` }}
            />
            Low spend
          </span>
        </div>
      )}
    </>
  );
}
