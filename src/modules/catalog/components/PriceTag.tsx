import { cn, formatMoney } from "@/lib/utils";

type Props = {
  cents: number;
  compareCents?: number | null;
  currency?: string;
  className?: string;
};

export function PriceTag({ cents, compareCents, currency = "USD", className }: Props) {
  const hasCompare = compareCents && compareCents > cents;
  return (
    <div className={cn("flex items-baseline gap-2", className)}>
      <span className="text-lg font-semibold">{formatMoney(cents, currency)}</span>
      {hasCompare ? (
        <span className="text-sm text-muted-foreground line-through">
          {formatMoney(compareCents, currency)}
        </span>
      ) : null}
    </div>
  );
}
