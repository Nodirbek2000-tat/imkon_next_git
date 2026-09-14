"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Badge, LiveDot } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState, ErrorState } from "@/components/ui/PageHeader";
import { Countdown } from "@/components/Countdown";
import { AuctionCreateForm } from "@/components/admin/AuctionCreateForm";
import { adminApi, ApiError, type AdminAuction } from "@/lib/api";
import { formatPrice, formatDate } from "@/lib/utils";

export function AdminAuctions({ onChange }: { onChange: () => void }) {
  const [auctions, setAuctions] = useState<AdminAuction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  /**
   * `silent` — ro'yxatni fonda yangilash.
   *
   * Auksion ochilgandan keyin skeletonga qaytsak forma qayta yaratiladi va
   * "ochildi" xabari ko'rinmay yo'qoladi. Shuning uchun birinchi yuklashda
   * skeleton, keyingilarida — jimgina yangilanish.
   */
  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError("");
    try {
      const data = await adminApi.auctions();
      setAuctions(data.results);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Yuklab bo'lmadi");
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const afterAction = () => {
    load(true);
    onChange();
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-32 w-full rounded-2xl" />
        ))}
      </div>
    );
  }

  // `onRetry={load}` yozib bo'lmaydi — tugma bosilishi hodisasi birinchi
  // argument bo'lib tushib, uni "silent" deb o'qib qolardi
  if (error) return <ErrorState message={error} onRetry={() => load()} />;

  return (
    <div className="space-y-8">
      <AuctionCreateForm onCreated={afterAction} />

      {auctions.length === 0 ? (
        <EmptyState title="Auksion yo'q" />
      ) : (
        <ul className="space-y-4">
          {auctions.map((auction) => (
            <li key={auction.id}>
              <AuctionRow auction={auction} onAction={afterAction} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function AuctionRow({
  auction,
  onAction,
}: {
  auction: AdminAuction;
  onAction: () => void;
}) {
  const [busy, setBusy] = useState<"finalize" | "cancel" | null>(null);
  const [error, setError] = useState("");

  const run = async (action: "finalize" | "cancel") => {
    setBusy(action);
    setError("");
    try {
      if (action === "finalize") await adminApi.finalizeAuction(auction.id);
      else await adminApi.cancelAuction(auction.id);
      onAction();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Amal bajarilmadi");
    } finally {
      setBusy(null);
    }
  };

  const isLive = auction.status === "live";
  const canAct = isLive;

  const statusBadge = {
    live: <Badge tone="live"><LiveDot />Jonli</Badge>,
    pending: <Badge tone="neutral">Boshlanmagan</Badge>,
    ended: <Badge tone="gold">Tugagan</Badge>,
    cancelled: <Badge tone="neutral">Bekor qilingan</Badge>,
  }[auction.status];

  return (
    <article className="rounded-[var(--radius-card)] border bg-[var(--surface)] p-6 transition-shadow duration-500 hover:shadow-[var(--shadow-lift)]">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold">
            <Link href={`/auksion/${auction.id}`} className="hover:text-brand-600">
              {auction.product_title}
            </Link>
          </h3>
          <p className="mt-1 text-[13px] text-ink-600 dark:text-ink-400">
            {auction.artisan_name}
          </p>
        </div>
        {statusBadge}
      </div>

      <dl className="mt-5 grid gap-x-8 gap-y-4 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <dt className="text-[11px] font-semibold tracking-[0.1em] text-ink-600 uppercase dark:text-ink-400">
            Boshlang&apos;ich
          </dt>
          <dd className="mt-1 font-semibold">{formatPrice(Number(auction.start_price))}</dd>
        </div>

        <div>
          <dt className="text-[11px] font-semibold tracking-[0.1em] text-ink-600 uppercase dark:text-ink-400">
            Joriy narx
          </dt>
          <dd className="mt-1 font-display text-xl font-extrabold text-brand-600">
            {formatPrice(Number(auction.current_price))}
          </dd>
        </div>

        <div>
          <dt className="text-[11px] font-semibold tracking-[0.1em] text-ink-600 uppercase dark:text-ink-400">
            Takliflar
          </dt>
          <dd className="mt-1 font-semibold tabular-nums">{auction.bids_count}</dd>
        </div>

        <div>
          <dt className="text-[11px] font-semibold tracking-[0.1em] text-ink-600 uppercase dark:text-ink-400">
            {isLive ? "Qoldi" : "Tugash vaqti"}
          </dt>
          <dd className="mt-1 font-mono font-semibold">
            {isLive ? (
              <Countdown endAt={auction.end_at} />
            ) : (
              formatDate(auction.end_at, true)
            )}
          </dd>
        </div>
      </dl>

      {auction.winner_name && (
        <p className="mt-4 rounded-2xl bg-success/10 px-4 py-2.5 text-sm font-medium text-success">
          G&apos;olib: {auction.winner_name}
        </p>
      )}

      {canAct && (
        <div className="mt-5 flex flex-wrap gap-3 border-t pt-5">
          <button
            type="button"
            onClick={() => run("finalize")}
            disabled={busy !== null}
            className="rounded-full bg-ink-900 px-5 py-2.5 text-[13px] font-semibold text-white transition-all duration-300 hover:-translate-y-0.5 disabled:opacity-50 dark:bg-ink-100 dark:text-ink-950"
          >
            {busy === "finalize" ? "Yakunlanmoqda…" : "Hozir yakunlash"}
          </button>

          <button
            type="button"
            onClick={() => run("cancel")}
            disabled={busy !== null}
            className="rounded-full border-2 border-[var(--line)] px-5 py-2.5 text-[13px] font-semibold transition-all duration-300 hover:border-brand-600 hover:text-brand-600 disabled:opacity-50"
          >
            {busy === "cancel" ? "…" : "Bekor qilish"}
          </button>
        </div>
      )}

      {error && (
        <p role="alert" className="mt-4 text-sm font-medium text-brand-600">
          {error}
        </p>
      )}
    </article>
  );
}
