"use client";

import { useMemo } from "react";
import type { CategoryTotal } from "@/lib/finops-aggregate";
import { getCategoryColor } from "@/lib/mode-colors";
import { CurrencyAmount } from "@/components/finops/currency-amount";

const SIZE = 160;
const CENTER = SIZE / 2;
const RADIUS = 62;
const STROKE_WIDTH = 18;
const GAP = 3;
const MIN_ARC = 4;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function SpendDonut({ categoryTotals }: { categoryTotals: CategoryTotal[] }) {
  const total = categoryTotals.reduce((sum, c) => sum + c.amount, 0);

  const segments = useMemo(() => {
    if (total <= 0 || categoryTotals.length === 0) return [];

    const n = categoryTotals.length;
    const availableLength = Math.max(CIRCUMFERENCE - GAP * n, 0);

    let cumulative = 0;
    return categoryTotals.map((c) => {
      const rawLength = (c.amount / total) * availableLength;
      const arcLength = Math.max(rawLength, MIN_ARC);
      const dashoffset = -cumulative;
      cumulative += arcLength + GAP;
      return {
        key: `${c.mode}::${c.category}`,
        color: getCategoryColor(c.mode, c.category),
        dasharray: `${arcLength} ${CIRCUMFERENCE - arcLength}`,
        dashoffset,
      };
    });
  }, [categoryTotals, total]);

  return (
    <div className="relative shrink-0" style={{ width: SIZE, height: SIZE }}>
      <svg
        width={SIZE}
        height={SIZE}
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        aria-hidden="true"
      >
        <g transform={`rotate(-90 ${CENTER} ${CENTER})`}>
          {segments.length === 0 ? (
            <circle
              cx={CENTER}
              cy={CENTER}
              r={RADIUS}
              fill="none"
              stroke="var(--muted)"
              strokeWidth={STROKE_WIDTH}
            />
          ) : (
            segments.map((seg) => (
              <circle
                key={seg.key}
                cx={CENTER}
                cy={CENTER}
                r={RADIUS}
                fill="none"
                stroke={seg.color}
                strokeWidth={STROKE_WIDTH}
                strokeLinecap="butt"
                strokeDasharray={seg.dasharray}
                strokeDashoffset={seg.dashoffset}
              />
            ))
          )}
        </g>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xs text-muted-foreground">Total</span>
        <CurrencyAmount
          amount={total}
          className="text-xl font-semibold leading-tight"
          iconClassName="size-4"
        />
      </div>
    </div>
  );
}
