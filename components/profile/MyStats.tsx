"use client";

import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/Skeleton";
import { Reveal } from "@/components/ui/Reveal";
import { api, type ApiMyStats } from "@/lib/api";
import { cn, formatNumber, formatPrice } from "@/lib/utils";

type Card = { label: string; value: string; hint?: string; accent?: boolean };

export function MyStats() {
  const [stats, setStats] = useState<ApiMyStats | null>(null);

  useEffect(() => {
    api.myStats().then(setStats).catch(() => setStats(null));
  }, []);

  if (!stats) {
    return (
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <li key={i} className="rounded-[var(--radius-card)] border p-6">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="mt-4 h-10 w-20" />
          </li>
        ))}
      </ul>
    );
  }

  const cards: Card[] = [
    {
      label: "Bu oy sotilgan",
      value: formatNumber(stats.sold_this_month),
      accent: stats.sold_this_month > 0,
    },
    {
      label: "Bu oy daromad",
      value: formatPrice(Number(stats.revenue_this_month)),
      accent: Number(stats.revenue_this_month) > 0,
    },
    { label: "Jami sotilgan", value: formatNumber(stats.products_sold) },
    { label: "Jami daromad", value: formatPrice(Number(stats.revenue_total)) },
    { label: "Sotuvda", value: formatNumber(stats.products_active) },
    { label: "Jami mahsulot", value: formatNumber(stats.products_total) },
  ];

  return (
    <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {cards.map((card, i) => (
        <li key={card.label}>
          <Reveal delay={i * 0.05}>
            <div
              className={cn(
                "group relative h-full overflow-hidden rounded-[var(--radius-card)] border p-6",
                "transition-[transform,box-shadow,border-color] duration-500 [transition-timing-function:var(--ease-out-soft)]",
                "hover:-translate-y-1 hover:shadow-[var(--shadow-lift)]",
                card.accent
                  ? "border-brand-600/40 bg-brand-50 dark:bg-brand-950/40"
                  : "bg-[var(--surface)] hover:border-brand-600/40",
              )}
            >
              <span
                aria-hidden="true"
                className="absolute inset-x-0 bottom-0 h-1 origin-left scale-x-0 bg-brand-600 transition-transform duration-500 [transition-timing-function:var(--ease-out-soft)] group-hover:scale-x-100"
              />
              <p className="text-[13px] font-medium text-ink-600 dark:text-ink-400">
                {card.label}
              </p>
              <p
                className={cn(
                  "mt-3 font-display text-3xl font-extrabold tabular-nums",
                  card.accent && "text-brand-600",
                )}
              >
                {card.value}
              </p>
            </div>
          </Reveal>
        </li>
      ))}
    </ul>
  );
}
