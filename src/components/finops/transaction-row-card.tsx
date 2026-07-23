import Link from "next/link";
import { formatFirstCap, formatPaymentMethodShort } from "@/lib/format";
import { getCategoryIcon } from "@/lib/category-icons";
import { getModeTone } from "@/lib/mode-colors";
import type { TransactionRow } from "@/lib/finops-shared";
import { Card } from "@/components/ui/card";
import { Amount } from "@/components/finops/amount";

/** One card of hairline-divided, tappable transaction rows — each links to
 * that transaction's edit page. Shared by the day-grouped list on the main
 * screen and the dashboard's single-day drill-down. */
export function TransactionRowCard({ rows }: { rows: TransactionRow[] }) {
  return (
    <Card className="p-0">
      <div className="divide-y divide-border">
        {rows.map((row) => {
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
  );
}
