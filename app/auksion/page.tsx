"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Container } from "@/components/ui/Container";
import { PageHeader, EmptyState, ErrorState } from "@/components/ui/PageHeader";
import { Badge, LiveDot } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { Countdown } from "@/components/Countdown";
import { Reveal } from "@/components/ui/Reveal";
import { api, ApiError, type ApiAuction } from "@/lib/api";
import { formatPrice, cn } from "@/lib/utils";

export default function AuctionsPage() {
  const [auctions, setAuctions] = useState<ApiAuction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [onlyLive, setOnlyLive] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await api.auctions(onlyLive);
      setAuctions(data.results);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Yuklab bo'lmadi");
    } finally {
      setLoading(false);
    }
  }, [onlyLive]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <>
      <PageHeader
        eyebrow="Auksion"
        title="Narxni siz belgilaysiz"
        description="Taklif qiling, kuzating, yuting. Har bir taklif hunarmandning mehnatiga qo'yilgan qiymat."
      />

      <Container className="py-12">
        <div className="mb-10 flex gap-2">
          <button
            type="button"
            onClick={() => setOnlyLive(true)}
            aria-pressed={onlyLive}
            className={cn(
              "rounded-full border-2 px-5 py-2 text-sm font-semibold transition-all duration-300",
              onlyLive
                ? "border-brand-600 bg-brand-600 text-white"
                : "border-[var(--line)] hover:border-brand-600",
            )}
          >
            Jonli
          </button>
          <button
            type="button"
            onClick={() => setOnlyLive(false)}
            aria-pressed={!onlyLive}
            className={cn(
              "rounded-full border-2 px-5 py-2 text-sm font-semibold transition-all duration-300",
              !onlyLive
                ? "border-brand-600 bg-brand-600 text-white"
                : "border-[var(--line)] hover:border-brand-600",
            )}
          >
            Hammasi
          </button>
        </div>

        {loading ? (
          <ul className="grid gap-6 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <li key={i} className="overflow-hidden rounded-[var(--radius-card)] border">
                <Skeleton className="aspect-16/10 rounded-none" />
                <div className="space-y-3 p-6">
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-20 w-full" />
                  <Skeleton className="h-10 w-1/2" />
                </div>
              </li>
            ))}
          </ul>
        ) : error ? (
          <ErrorState message={error} onRetry={load} />
        ) : auctions.length === 0 ? (
          <EmptyState
            title="Auksion yo'q"
            hint={onlyLive ? "Hozircha jonli lot yo'q. 'Hammasi' ni ko'ring." : undefined}
          />
        ) : (
          <ul className="grid gap-6 lg:grid-cols-3">
            {auctions.map((auction, i) => (
              <li key={auction.id}>
                <Reveal delay={Math.min(i, 5) * 0.08}>
                  <AuctionListCard auction={auction} />
                </Reveal>
              </li>
            ))}
          </ul>
        )}
      </Container>
    </>
  );
}

function AuctionListCard({ auction }: { auction: ApiAuction }) {
  const growth =
    Number(auction.start_price) > 0
      ? Math.round(
          ((Number(auction.current_price) - Number(auction.start_price)) /
            Number(auction.start_price)) *
            100,
        )
      : 0;

  return (
    <article className="group relative h-full overflow-hidden rounded-[var(--radius-card)] border bg-[var(--surface)] shadow-[var(--shadow-soft)] transition-[transform,box-shadow] duration-500 [transition-timing-function:var(--ease-out-soft)] hover:-translate-y-1.5 hover:shadow-[var(--shadow-lift)]">
      <div className="relative aspect-16/10 overflow-hidden">
        {auction.product.main_image ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={auction.product.main_image.url}
            alt={auction.product.main_image.alt || auction.product.title}
            className="size-full object-cover transition-transform duration-[900ms] group-hover:scale-[1.08]"
            loading="lazy"
          />
        ) : (
          <div
            className="grain size-full transition-transform duration-[900ms] group-hover:scale-[1.08]"
            style={{ background: "linear-gradient(135deg, #a06d14, #f1cd7e)" }}
            aria-hidden="true"
          />
        )}

        <div className="absolute top-4 left-4 flex gap-2">
          {auction.is_live ? (
            <Badge tone="live">
              <LiveDot />
              Jonli
            </Badge>
          ) : (
            <Badge tone="neutral">
              {auction.status === "ended" ? "Tugagan" : "Boshlanmagan"}
            </Badge>
          )}
          <Badge tone="gold">{auction.bids_count} taklif</Badge>
        </div>
      </div>

      <div className="p-6">
        <h2 className="text-xl leading-snug font-bold transition-colors duration-300 group-hover:text-brand-600">
          <Link href={`/auksion/${auction.id}`} className="after:absolute after:inset-0">
            {auction.product.title}
          </Link>
        </h2>
        <p className="mt-1.5 text-[13px] text-ink-600 dark:text-ink-400">
          {auction.product.artisan.shop_name}
        </p>

        <div className="mt-5 rounded-2xl bg-ink-100 p-4 dark:bg-ink-900">
          <p className="text-[11px] font-semibold tracking-[0.12em] text-ink-600 uppercase dark:text-ink-400">
            Tugashiga qoldi
          </p>
          <Countdown endAt={auction.end_at} className="mt-2 block font-mono text-2xl font-bold" />
        </div>

        <div className="mt-5 flex items-end justify-between">
          <div>
            <p className="text-[11px] font-semibold tracking-[0.12em] text-ink-600 uppercase dark:text-ink-400">
              Joriy narx
            </p>
            <p className="font-display text-2xl font-extrabold text-brand-600">
              {formatPrice(Number(auction.current_price))}
            </p>
          </div>
          {growth > 0 && (
            <span className="rounded-full bg-success/10 px-2.5 py-1 text-xs font-bold text-success">
              +{growth}%
            </span>
          )}
        </div>
      </div>
    </article>
  );
}
