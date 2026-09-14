"use client";

import Link from "next/link";
import { Badge, LiveDot } from "@/components/ui/Badge";
import { Countdown } from "@/components/Countdown";
import { formatPrice } from "@/lib/utils";
import type { ApiAuction } from "@/lib/api";

/**
 * Auksion loti kartasi — haqiqiy ma'lumot bilan.
 *
 * Butun karta bitta havola: qayeriga bosilmasin lot sahifasiga olib
 * boradi. Mahsulot kartasidan farqi shu — u yerda savat tugmasi bor,
 * shuning uchun u yerda faqat rasm va nom havola bo'la oladi.
 */
export function ApiAuctionCard({ auction }: { auction: ApiAuction }) {
  const image = auction.product.gallery?.[0] ?? auction.product.main_image;
  const ended = !auction.is_live;

  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-2xl border bg-[var(--surface)] shadow-[var(--shadow-soft)] transition-[transform,box-shadow] duration-500 [transition-timing-function:var(--ease-out-soft)] hover:-translate-y-1 hover:shadow-[var(--shadow-lift)]">
      <div className="relative aspect-square overflow-hidden bg-ink-100 dark:bg-ink-800">
        {image ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={image.url}
            alt={image.alt || auction.product.title}
            className="size-full object-cover"
            loading="lazy"
          />
        ) : (
          <div
            className="grain size-full"
            style={{ background: "linear-gradient(135deg, #a06d14, #f1cd7e)" }}
            aria-hidden="true"
          />
        )}

        <div className="pointer-events-none absolute top-2 left-2 flex flex-wrap gap-1.5">
          {ended ? (
            <Badge tone="neutral" className="px-2 py-0.5 text-[10px]">
              Tugagan
            </Badge>
          ) : (
            <Badge tone="live" className="px-2 py-0.5 text-[10px]">
              <LiveDot />
              Jonli
            </Badge>
          )}
          <Badge tone="gold" className="px-2 py-0.5 text-[10px]">
            {auction.bids_count} taklif
          </Badge>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-1.5 p-3">
        <p className="font-display text-[17px] leading-none font-extrabold text-brand-600">
          {formatPrice(Number(auction.current_price))}
        </p>

        <h3 className="line-clamp-2 text-[13px] leading-snug transition-colors duration-300 group-hover:text-brand-600">
          {/* `after:absolute after:inset-0` — butun karta bosiladigan bo'ladi */}
          <Link href={`/auksion/${auction.id}`} className="after:absolute after:inset-0">
            {auction.product.title}
          </Link>
        </h3>

        <p className="truncate text-[12px] text-ink-600 dark:text-ink-400">
          {auction.product.artisan.shop_name}
        </p>

        <div className="mt-auto pt-2">
          <div className="flex h-9 items-center justify-center gap-2 rounded-full bg-ink-100 text-[13px] dark:bg-ink-800">
            <span className="text-ink-600 dark:text-ink-400">
              {ended ? "Tugadi" : "Qoldi"}
            </span>
            {!ended && (
              <Countdown endAt={auction.end_at} className="font-mono font-bold" />
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
