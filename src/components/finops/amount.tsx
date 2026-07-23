import { cn } from "@/lib/utils";

/** "$213.48" with the cents rendered smaller, per the app's currency
 * formatting rule — cents size scales with `size` so this composes with
 * any context (day totals, hero totals, insight cards). */
export function Amount({
  value,
  size = 17,
  className,
  centsClassName,
}: {
  value: number;
  size?: number;
  className?: string;
  centsClassName?: string;
}) {
  const rounded = Math.round(value * 100) / 100;
  const [whole, cents] = Math.abs(rounded).toFixed(2).split(".");
  const sign = rounded < 0 ? "-" : "";
  const centsSize = Math.round(size * (13 / 17) * 10) / 10;

  return (
    <span
      className={cn("inline-flex items-baseline font-medium", className)}
      style={{ fontSize: size }}
    >
      {sign}${whole}
      <span className={cn(centsClassName)} style={{ fontSize: centsSize }}>
        .{cents}
      </span>
    </span>
  );
}
