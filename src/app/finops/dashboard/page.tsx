import { supabase } from "@/lib/supabase";
import {
  addMonthsToKey,
  currentMonthKeyByWeekEnding,
  formatMonthYear,
  getMonthRangeFromKey,
  getYearRange,
  toDateString,
} from "@/lib/dates";
import { buildCalendarDays, buildYearMonthTotals } from "@/lib/finops-calendar";
import { DashboardScreen } from "@/components/finops/dashboard-screen";
import type { TransactionRow } from "@/lib/finops-shared";

export const dynamic = "force-dynamic";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; view?: string; year?: string }>;
}) {
  const { month, view, year } = await searchParams;
  const thisMonthKey = currentMonthKeyByWeekEnding();
  const thisYear = Number(thisMonthKey.slice(0, 4));

  if (view === "year") {
    const selectedYear = year && /^\d{4}$/.test(year) ? Number(year) : thisYear;
    const { yearStart, yearEnd } = getYearRange(selectedYear);

    const { data, error } = await supabase
      .from("transactions")
      .select("amount, mode, week_ending")
      .gte("week_ending", yearStart)
      .lte("week_ending", yearEnd)
      .gte("amount", 0)
      .returns<{ amount: number; mode: string; week_ending: string }[]>();

    if (error) {
      return (
        <main className="min-h-dvh bg-muted/30 px-4 py-6">
          <p className="text-destructive">Failed to load transactions: {error.message}</p>
        </main>
      );
    }

    return (
      <DashboardScreen
        view="year"
        year={selectedYear}
        prevYearHref={`/finops/dashboard?view=year&year=${selectedYear - 1}`}
        nextYearHref={
          selectedYear < thisYear
            ? `/finops/dashboard?view=year&year=${selectedYear + 1}`
            : null
        }
        monthTotals={buildYearMonthTotals(data ?? [], selectedYear)}
        monthViewHref={`/finops/dashboard?month=${thisMonthKey}`}
      />
    );
  }

  const monthKey = month && /^\d{4}-\d{2}$/.test(month) ? month : thisMonthKey;
  const { monthStart, monthEnd } = getMonthRangeFromKey(monthKey);
  const calendarDays = buildCalendarDays(monthKey, toDateString(new Date()));
  const prevMonthKey = addMonthsToKey(monthKey, -1);
  const { monthStart: prevMonthStart, monthEnd: prevMonthEnd } = getMonthRangeFromKey(prevMonthKey);

  const [currentResult, prevResult] = await Promise.all([
    supabase
      .from("transactions")
      .select("*")
      .gte("week_ending", monthStart)
      .lte("week_ending", monthEnd)
      .gte("amount", 0)
      .returns<TransactionRow[]>(),
    supabase
      .from("transactions")
      .select("amount, mode")
      .gte("week_ending", prevMonthStart)
      .lte("week_ending", prevMonthEnd)
      .gte("amount", 0)
      .returns<{ amount: number; mode: string }[]>(),
  ]);

  if (currentResult.error || prevResult.error) {
    const error = currentResult.error ?? prevResult.error;
    return (
      <main className="min-h-dvh bg-muted/30 px-4 py-6">
        <p className="text-destructive">Failed to load transactions: {error?.message}</p>
      </main>
    );
  }

  const nextMonthKey = addMonthsToKey(monthKey, 1);

  return (
    <DashboardScreen
      view="month"
      monthKey={monthKey}
      monthLabel={formatMonthYear(monthKey)}
      prevHref={`/finops/dashboard?month=${prevMonthKey}`}
      nextHref={nextMonthKey <= thisMonthKey ? `/finops/dashboard?month=${nextMonthKey}` : null}
      rows={currentResult.data ?? []}
      prevMonthRows={prevResult.data ?? []}
      calendarDays={calendarDays}
      yearViewHref={`/finops/dashboard?view=year&year=${Number(monthKey.slice(0, 4))}`}
    />
  );
}
