import type { ReactNode } from "react";
import { Amount } from "@/components/finops/amount";
import { formatFirstCap } from "@/lib/format";
import { MODE_ORDER } from "@/lib/mode-colors";
import type { ModeFilter } from "@/lib/finops-calendar";
import type { TransactionRow } from "@/lib/finops-shared";

const MAX_SLICES = 5;
const REST_COLOR = "#B8C2CC";
// Blues first so the chart sits in the app's colour theme, then accents.
const SLICE_COLORS = ["#00A3DD", "#0F6E56", "#F59E0B", "#8B7CF6", "#E0735A"];

const RADIUS = 40;
const STROKE = 12;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const GAP = 2;

type Group = { label: string; amount: number };
type Slice = Group & { color: string };

function modeOf(row: TransactionRow) {
  return row.mode === "Flex" || row.mode === "Fixed" ? row.mode : "Big Amount";
}

function descriptionOf(row: TransactionRow) {
  return formatFirstCap(row.description.trim() || "No description");
}

function groupTotals(rows: TransactionRow[], keyOf: (r: TransactionRow) => string): Group[] {
  const map = new Map<string, number>();
  for (const row of rows) {
    const key = keyOf(row);
    map.set(key, (map.get(key) ?? 0) + row.amount);
  }
  return [...map.entries()]
    .map(([label, amount]) => ({ label, amount }))
    .sort((a, b) => b.amount - a.amount);
}

function withRest(groups: Group[]): Slice[] {
  const slices = groups.slice(0, MAX_SLICES).map((g, i) => ({ ...g, color: SLICE_COLORS[i] }));
  const rest = groups.slice(MAX_SLICES).reduce((sum, g) => sum + g.amount, 0);
  if (rest > 0) slices.push({ label: "Rest", amount: rest, color: REST_COLOR });
  return slices;
}

/** Donut of where the spend went. "All" splits by mode; a single mode splits
 * by category (Big Amount rows are all "Others", so those split by
 * description instead). Rows are expected to be already filtered. */
export function SpendDonut({
  rows,
  filter,
  title,
}: {
  rows: TransactionRow[];
  filter: ModeFilter;
  title: string;
}) {
  const total = rows.reduce((sum, r) => sum + r.amount, 0);
  if (total <= 0) {
    return (
      <section className="space-y-2">
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        <p className="text-xs text-muted-foreground">No spending to show.</p>
      </section>
    );
  }

  const splitByMode = filter === "All";
  const splitByDescription = filter === "Big";
  const keyOf = splitByMode ? modeOf : splitByDescription ? descriptionOf : (r: TransactionRow) => r.category;

  const groups = groupTotals(rows, keyOf);
  const slices = splitByMode
    ? [...groups]
        .sort((a, b) => MODE_ORDER.indexOf(a.label as never) - MODE_ORDER.indexOf(b.label as never))
        .map((g) => ({ ...g, color: SLICE_COLORS[MODE_ORDER.indexOf(g.label as never)] }))
    : withRest(groups);

  // The biggest real slice (never the "Rest" bucket).
  const biggest = groups[0];
  const biggestPct = Math.round((biggest.amount / total) * 100);

  // The "why": inside the biggest slice, which single thing added up the most.
  const inBiggest = rows.filter((r) => keyOf(r) === biggest.label);
  const topInside = groupTotals(inBiggest, splitByMode ? (r) => r.category : descriptionOf)[0];
  const scope = splitByMode ? "your spend" : `${filter === "Big" ? "Big" : filter} spend`;

  let why: ReactNode = (
    <>
      {biggest.label} is {biggestPct}% of {scope}.
    </>
  );
  if (!splitByDescription && topInside.label !== biggest.label) {
    why = (
      <>
        {biggest.label} is {biggestPct}% of {scope}, mostly {topInside.label} (
        <Amount value={topInside.amount} size={12} />
        ).
      </>
    );
  }

  return (
    <section className="space-y-4">
      <p className="text-sm font-medium text-muted-foreground">{title}</p>

      <div className="relative mx-auto size-44">
        <svg viewBox="0 0 100 100" className="size-full -rotate-90">
          <circle
            cx="50"
            cy="50"
            r={RADIUS}
            fill="none"
            strokeWidth={STROKE}
            className="stroke-muted/60"
          />
          {slices.map((s, i) => {
            const len = (s.amount / total) * CIRCUMFERENCE;
            const start = slices.slice(0, i).reduce((sum, p) => sum + p.amount, 0) / total;
            const visible = slices.length === 1 ? len : Math.max(len - GAP, 0.5);
            return (
              <circle
                key={s.label}
                cx="50"
                cy="50"
                r={RADIUS}
                fill="none"
                stroke={s.color}
                strokeWidth={STROKE}
                strokeDasharray={`${visible} ${CIRCUMFERENCE - visible}`}
                strokeDashoffset={-start * CIRCUMFERENCE}
              />
            );
          })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-3xl font-medium">{biggestPct}%</span>
          <span className="max-w-24 truncate text-xs text-muted-foreground">{biggest.label}</span>
        </div>
      </div>

      <div className="space-y-2">
        {slices.map((s) => (
          <div key={s.label} className="flex items-center justify-between gap-3 text-sm">
            <span className="flex min-w-0 items-center gap-2">
              <span
                className="size-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: s.color }}
              />
              <span className="truncate">{s.label}</span>
            </span>
            <span className="flex shrink-0 items-center gap-2 text-muted-foreground">
              <span className="text-xs">{Math.round((s.amount / total) * 100)}%</span>
              <Amount value={s.amount} size={13} className="text-foreground" />
            </span>
          </div>
        ))}
      </div>

      <p className="text-xs text-muted-foreground">{why}</p>
    </section>
  );
}
