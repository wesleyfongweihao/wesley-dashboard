"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { formatFirstCap, formatPaymentMethodShort } from "@/lib/format";
import { getCategoryIcon } from "@/lib/category-icons";
import { getModeTone } from "@/lib/mode-colors";
import type { TransactionRow } from "@/lib/finops-shared";
import { Card } from "@/components/ui/card";
import { Amount } from "@/components/finops/amount";

function transactionSubtext(row: TransactionRow): string {
  return [
    formatPaymentMethodShort(row.payment_method),
    row.description.trim() ? formatFirstCap(row.description.trim()) : "",
    row.quantity === null ? "" : String(row.quantity),
  ]
    .filter(Boolean)
    .join(" · ");
}

/** One tappable transaction row — links to that transaction's edit page. */
function transactionLink(row: TransactionRow, className: string) {
  const Icon = getCategoryIcon(row.category);
  const tone = getModeTone(row.mode);
  return (
    <Link
      key={row.id}
      href={`/finops/edit/${row.id}`}
      className={`flex items-center gap-3 transition-colors hover:bg-muted/50 ${className}`}
    >
      <span
        className="flex size-9 shrink-0 items-center justify-center rounded-full"
        style={{ backgroundColor: tone.bg, color: tone.fg }}
      >
        <Icon className="size-4" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{row.category}</p>
        <p className="truncate text-xs text-muted-foreground">{transactionSubtext(row)}</p>
      </div>
      <Amount value={row.amount} size={15} />
    </Link>
  );
}

type CategoryGroup = {
  key: string;
  category: string;
  mode: string;
  rows: TransactionRow[];
  total: number;
};

/** Groups by mode+category so same-named categories from different modes
 * (e.g. "Others" under both Flex and Big Amount) don't get merged. */
function groupByCategory(rows: TransactionRow[]): CategoryGroup[] {
  const map = new Map<string, CategoryGroup>();
  for (const row of rows) {
    const key = `${row.mode}::${row.category}`;
    const existing = map.get(key);
    if (existing) {
      existing.rows.push(row);
      existing.total += row.amount;
    } else {
      map.set(key, { key, category: row.category, mode: row.mode, rows: [row], total: row.amount });
    }
  }
  return [...map.values()];
}

/** One card of hairline-divided transaction rows, grouped by category —
 * a category with more than one transaction collapses to a single row
 * (tap to expand into its individual transactions); a category with just
 * one transaction shows that transaction directly. Each individual
 * transaction still links straight to its edit page. Shared by the
 * day-grouped list on the main screen and the dashboard's single-day
 * drill-down. */
export function TransactionRowCard({ rows }: { rows: TransactionRow[] }) {
  const [openKeys, setOpenKeys] = useState<Set<string>>(new Set());
  const groups = groupByCategory(rows);

  function toggle(key: string) {
    setOpenKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }

  return (
    <Card className="p-0">
      <div className="divide-y divide-border">
        {groups.map((group) => {
          if (group.rows.length === 1) {
            return transactionLink(group.rows[0], "px-4 py-3.5");
          }

          const Icon = getCategoryIcon(group.category);
          const tone = getModeTone(group.mode);
          const isOpen = openKeys.has(group.key);

          return (
            <div key={group.key}>
              <button
                type="button"
                onClick={() => toggle(group.key)}
                className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-muted/50"
              >
                <span
                  className="flex size-9 shrink-0 items-center justify-center rounded-full"
                  style={{ backgroundColor: tone.bg, color: tone.fg }}
                >
                  <Icon className="size-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{group.category}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {group.rows.length} transactions
                  </p>
                </div>
                <Amount value={group.total} size={15} />
                <ChevronDown
                  className={`size-4 shrink-0 text-muted-foreground transition-transform ${
                    isOpen ? "rotate-180" : ""
                  }`}
                />
              </button>
              {isOpen && (
                <div className="divide-y divide-border bg-muted/30">
                  {group.rows.map((row) => transactionLink(row, "pl-9 pr-4 py-3"))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
}
