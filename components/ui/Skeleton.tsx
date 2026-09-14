import { cn } from "@/lib/utils";

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "animate-shimmer rounded-lg bg-ink-200 dark:bg-ink-800",
        className,
      )}
    />
  );
}

/** Mahsulot kartasi yuklanayotgandagi holat */
export function ProductCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-[var(--radius-card)] border bg-[var(--surface)]">
      <Skeleton className="aspect-4/5 rounded-none" />
      <div className="space-y-3 p-5">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-5 w-4/5" />
        <Skeleton className="h-4 w-full" />
        <div className="flex items-center justify-between pt-2">
          <Skeleton className="h-6 w-28" />
          <Skeleton className="size-10 rounded-full" />
        </div>
      </div>
    </div>
  );
}

/** Sahifa yuklanishi — brend spinner */
export function PageLoader({ label = "Yuklanmoqda" }: { label?: string }) {
  return (
    <div
      className="flex min-h-[60vh] flex-col items-center justify-center gap-5"
      role="status"
      aria-live="polite"
    >
      <div className="relative size-14">
        <div className="absolute inset-0 rounded-full border-[3px] border-ink-200 dark:border-ink-800" />
        <div className="absolute inset-0 animate-spin rounded-full border-[3px] border-transparent border-t-brand-600 [animation-duration:0.9s]" />
      </div>
      <p className="text-sm font-medium tracking-wide text-ink-600 dark:text-ink-400">{label}…</p>
    </div>
  );
}
