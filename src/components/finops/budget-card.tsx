import { Card, CardContent } from "@/components/ui/card";
import { Amount } from "@/components/finops/amount";

const REMAINDER_COLOR = "#ECECEC";

type Segment = { key: string; label: string; amount: number; color: string };

function BudgetRing({
  percent,
  color,
  trackColor,
  size = 84,
  strokeWidth = 9,
}: {
  percent: number;
  color: string;
  trackColor: string;
  size?: number;
  strokeWidth?: number;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const fraction = Math.min(Math.max(percent, 0), 100) / 100;
  const filled = fraction * circumference;
  const isOver = percent > 100;

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={trackColor}
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={isOver ? "#F59E0B" : color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={`${filled} ${circumference - filled}`}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className={`text-lg font-semibold ${isOver ? "text-amber-600" : ""}`}>
          {Math.round(percent)}%
        </span>
      </div>
    </div>
  );
}

function MiniBar({ segments }: { segments: Segment[] }) {
  const total = segments.reduce((sum, s) => sum + s.amount, 0) || 1;
  return (
    <div className="flex h-2 gap-[2px] overflow-hidden rounded-full bg-muted">
      {segments.map((s) => (
        <div
          key={s.key}
          className="h-full"
          style={{ width: `${(s.amount / total) * 100}%`, backgroundColor: s.color }}
        />
      ))}
    </div>
  );
}

function Legend({ segments }: { segments: Segment[] }) {
  return (
    <div className="grid grid-cols-2 gap-x-3 gap-y-1.5">
      {segments.map((s) => (
        <div key={s.key} className="flex items-center justify-between gap-2 text-xs">
          <span className="flex min-w-0 items-center gap-1.5 text-muted-foreground">
            <span className="size-2 shrink-0 rounded-full" style={{ backgroundColor: s.color }} />
            <span className="truncate">{s.label}</span>
          </span>
          <Amount value={s.amount} size={12} className="shrink-0" />
        </div>
      ))}
    </div>
  );
}

type TrendWeek = { label: string; amount: number };

/** A column per week against the budget threshold (dashed line) — lets
 * Wesley see whether he's missing budget occasionally or most weeks. */
function TrendChart({
  weeks,
  budget,
  accentColor,
}: {
  weeks: TrendWeek[];
  budget: number;
  accentColor: string;
}) {
  const chartHeight = 72;
  const maxValue = Math.max(budget, ...weeks.map((w) => w.amount), 1) * 1.15;
  const thresholdFromTop = chartHeight - (budget / maxValue) * chartHeight;

  return (
    <div className="space-y-1.5">
      <p className="text-xs text-muted-foreground">
        Last {weeks.length} weeks · dashed line is{" "}
        <Amount value={budget} size={11} className="text-muted-foreground" />
      </p>
      <div className="relative" style={{ height: chartHeight }}>
        <div
          className="absolute inset-x-0 border-t border-dashed border-muted-foreground/40"
          style={{ top: thresholdFromTop }}
        />
        <div className="flex h-full items-end justify-between gap-1.5">
          {weeks.map((w, i) => {
            const barHeight = w.amount > 0 ? Math.max((w.amount / maxValue) * chartHeight, 4) : 0;
            const over = w.amount > budget;
            return (
              <div key={i} className="flex-1">
                <div
                  className="mx-auto w-full max-w-6 rounded-t-[4px]"
                  style={{
                    height: barHeight,
                    backgroundColor: w.amount > 0 ? (over ? "#F59E0B" : accentColor) : "transparent",
                  }}
                />
              </div>
            );
          })}
        </div>
      </div>
      <div className="flex justify-between gap-1.5 text-center text-[10px] text-muted-foreground">
        {weeks.map((w, i) => (
          <span key={i} className="flex-1 truncate">
            {w.label}
          </span>
        ))}
      </div>
    </div>
  );
}

/** A weekly/monthly budget summary: a progress ring against the budget, the
 * amount spent and how far over/under budget it is, then either a breakdown
 * bar with a legend (pass `segments`, by week for Grocery — `remainderLabel`
 * appends an extra "unspent" segment since Grocery tracks against its
 * budget rather than itself) or a per-week trend chart against the budget
 * threshold (pass `trend`, used by Pocket). */
export function BudgetCard({
  title,
  budget,
  spent,
  accentColor,
  trackColor,
  segments = [],
  remainderLabel,
  trend,
}: {
  title: string;
  budget: number;
  spent: number;
  accentColor: string;
  trackColor: string;
  segments?: Segment[];
  remainderLabel?: string;
  trend?: TrendWeek[];
}) {
  const percent = budget > 0 ? (spent / budget) * 100 : 0;
  const isOver = spent > budget;
  const diff = Math.abs(spent - budget);

  const remainder =
    remainderLabel && !isOver
      ? [{ key: "remainder", label: remainderLabel, amount: budget - spent, color: REMAINDER_COLOR }]
      : [];
  const barSegments = [...segments, ...remainder];

  return (
    <Card>
      <CardContent className="space-y-4 p-4">
        <div className="flex items-center justify-between">
          <p className="text-base font-medium">{title}</p>
          <p className="flex items-center gap-1 text-xs text-muted-foreground">
            Budget <Amount value={budget} size={12} className="text-muted-foreground" />
          </p>
        </div>

        <div className="flex items-center gap-4">
          <BudgetRing percent={percent} color={accentColor} trackColor={trackColor} />
          <div className="space-y-1">
            <Amount value={spent} size={26} />
            <p className={`text-xs font-medium ${isOver ? "text-amber-600" : "text-emerald-600"}`}>
              {isOver ? "↑" : "↓"} <Amount value={diff} size={11} />{" "}
              {isOver ? "over budget" : "left"}
            </p>
          </div>
        </div>

        {barSegments.length > 0 && (
          <div className="space-y-2.5">
            <MiniBar segments={barSegments} />
            <Legend segments={barSegments} />
          </div>
        )}

        {trend && trend.length > 0 && (
          <TrendChart weeks={trend} budget={budget} accentColor={accentColor} />
        )}
      </CardContent>
    </Card>
  );
}
