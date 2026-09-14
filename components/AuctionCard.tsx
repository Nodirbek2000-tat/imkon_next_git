"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Artwork } from "@/components/ui/Artwork";
import { Badge, LiveDot } from "@/components/ui/Badge";
import { formatPrice, pad, timeLeft } from "@/lib/utils";
import type { Auction } from "@/lib/mock";

export function AuctionCard({ auction }: { auction: Auction }) {
  // null = hali mount bo'lmagan. Server va klient vaqti farq qiladi,
  // shuning uchun taymer faqat mount'dan keyin chiziladi.
  const [left, setLeft] = useState<ReturnType<typeof timeLeft> | undefined>();

  useEffect(() => {
    const tick = () => setLeft(timeLeft(auction.endAt));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [auction.endAt]);

  const ended = left === null;
  const urgent = !!left && left.total < 6 * 3_600_000;
  const growth = Math.round(
    ((auction.currentPrice - auction.startPrice) / auction.startPrice) * 100,
  );

  return (
    <article className="group relative overflow-hidden rounded-[var(--radius-card)] border bg-[var(--surface)] shadow-[var(--shadow-soft)] transition-[transform,box-shadow] duration-500 [transition-timing-function:var(--ease-out-soft)] hover:-translate-y-1.5 hover:shadow-[var(--shadow-lift)]">
      <div className="relative">
        <Artwork
          art={auction.art}
          image={auction.image}
          alt={auction.title}
          className="aspect-16/10"
        />

        <div className="absolute top-4 left-4 flex gap-2">
          <Badge tone="live" className={urgent ? "animate-ring" : ""}>
            <LiveDot />
            Jonli
          </Badge>
          <Badge tone="gold">{auction.bidsCount} taklif</Badge>
        </div>
      </div>

      <div className="p-6">
        <h3 className="text-xl leading-snug font-bold transition-colors duration-300 group-hover:text-brand-600">
          {/* Namuna lot — havola auksionlar ro'yxatiga (qarang: `ProductCard`) */}
          <Link href="/auksion" className="after:absolute after:inset-0">
            {auction.title}
          </Link>
        </h3>

        <p className="mt-1.5 text-[13px] text-ink-600 dark:text-ink-400">
          {auction.seller.name} · {auction.seller.craft}
        </p>

        {/* Taymer */}
        <div className="mt-5 rounded-2xl bg-ink-100 p-4 dark:bg-ink-900">
          <p className="text-[11px] font-semibold tracking-[0.12em] text-ink-600 dark:text-ink-400 uppercase">
            {ended ? "Auksion tugadi" : "Tugashiga qoldi"}
          </p>

          <div
            className="mt-2 flex items-baseline gap-1 font-mono text-2xl font-bold tabular-nums"
            aria-live="off"
          >
            {left === undefined ? (
              <span className="animate-shimmer text-ink-400">--:--:--</span>
            ) : ended ? (
              <span className="text-ink-400">00:00:00</span>
            ) : (
              <span className={urgent ? "text-brand-600" : ""}>
                {left.days > 0 && `${left.days}k `}
                {pad(left.hours)}:{pad(left.minutes)}:{pad(left.seconds)}
              </span>
            )}
          </div>
        </div>

        <div className="mt-5 flex items-end justify-between">
          <div>
            <p className="text-[11px] font-semibold tracking-[0.12em] text-ink-600 dark:text-ink-400 uppercase">
              Joriy narx
            </p>
            <p className="font-display text-2xl font-extrabold text-brand-600">
              {formatPrice(auction.currentPrice)}
            </p>
          </div>

          <span className="rounded-full bg-success/10 px-2.5 py-1 text-xs font-bold text-success">
            +{growth}%
          </span>
        </div>
      </div>
    </article>
  );
}
