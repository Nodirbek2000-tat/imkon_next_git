"use client";

import { Skeleton } from "@/components/ui/Skeleton";
import { Reveal } from "@/components/ui/Reveal";
import type { AdminStats } from "@/lib/api";
import { cn, formatNumber } from "@/lib/utils";

type Card = {
  label: string;
  value: number;
  hint?: string;
  accent?: boolean;
};

export function AdminStatsGrid({ stats }: { stats: AdminStats | null }) {
  if (!stats) {
    return (
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <li key={i} className="rounded-[var(--radius-card)] border p-6">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="mt-4 h-10 w-20" />
          </li>
        ))}
      </ul>
    );
  }

  const groups: { title: string; cards: Card[] }[] = [
    {
      title: "Foydalanuvchilar",
      cards: [
        { label: "Jami", value: stats.users_total },
        { label: "Yangi (7 kun)", value: stats.users_new_week },
        { label: "Hunarmandlar", value: stats.artisans_total },
        { label: "Adminlar", value: stats.admins_total },
      ],
    },
    {
      title: "Arizalar va mahsulotlar",
      cards: [
        {
          label: "Kutayotgan ariza",
          value: stats.applications_pending,
          hint: stats.applications_pending > 0 ? "ko'rib chiqish kerak" : undefined,
          accent: stats.applications_pending > 0,
        },
        { label: "Jami ariza", value: stats.applications_total },
        { label: "Mahsulot", value: stats.products_total },
        { label: "Sotuvda", value: stats.products_active },
      ],
    },
    {
      title: "Auksion",
      cards: [
        { label: "Jonli", value: stats.auctions_live, accent: stats.auctions_live > 0 },
        { label: "Jami lot", value: stats.auctions_total },
        { label: "Takliflar", value: stats.bids_total },
      ],
    },
    {
      title: "Maktablar",
      cards: [
        { label: "Maktablar", value: stats.schools_total },
        { label: "O'quvchilar", value: stats.students_total },
      ],
    },
  ];

  return (
    <div className="space-y-12">
      {groups.map((group, gi) => (
        <section key={group.title}>
          <h2 className="mb-5 flex items-center gap-3 text-[11px] font-semibold tracking-[0.16em] text-ink-600 uppercase dark:text-ink-400">
            <span className="h-px w-8 bg-brand-600" />
            {group.title}
          </h2>

          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {group.cards.map((card, i) => (
              <li key={card.label}>
                <Reveal delay={gi * 0.05 + i * 0.05}>
                  <StatCard card={card} />
                </Reveal>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

function StatCard({ card }: { card: Card }) {
  return (
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
      {/* Hover'da pastdan ko'tariladigan qizil chiziq */}
      <span
        aria-hidden="true"
        className="absolute inset-x-0 bottom-0 h-1 origin-left scale-x-0 bg-brand-600 transition-transform duration-500 [transition-timing-function:var(--ease-out-soft)] group-hover:scale-x-100"
      />

      <p className="text-[13px] font-medium text-ink-600 dark:text-ink-400">{card.label}</p>

      <p
        className={cn(
          "mt-3 font-display text-4xl font-extrabold tabular-nums",
          card.accent && "text-brand-600",
        )}
      >
        {formatNumber(card.value)}
      </p>

      {card.hint && (
        <p className="mt-1.5 text-[12px] font-medium text-brand-600">{card.hint}</p>
      )}
    </div>
  );
}
