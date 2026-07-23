import { Banknote } from "lucide-react";
import { formatAmountValue } from "@/lib/format";
import { cn } from "@/lib/utils";

export function CurrencyAmount({
  amount,
  className,
  iconClassName,
}: {
  amount: number;
  className?: string;
  iconClassName?: string;
}) {
  return (
    <span className={cn("inline-flex items-center gap-1", className)}>
      <Banknote className={cn("size-3.5", iconClassName)} />
      {formatAmountValue(amount)}
    </span>
  );
}
