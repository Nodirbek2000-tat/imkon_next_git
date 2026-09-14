"use client";

import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/Skeleton";
import {
  api,
  type ApiBalance,
  type ApiBalanceTransaction,
} from "@/lib/api";
import { formatDate, formatPrice } from "@/lib/utils";

export function MyBalance() {
  const [balance, setBalance] = useState<ApiBalance | null>(null);
  const [transactions, setTransactions] = useState<ApiBalanceTransaction[] | null>(
    null,
  );

  useEffect(() => {
    api.myBalance().then(setBalance).catch(() => setBalance(null));
    api
      .balanceTransactions()
      .then((data) => setTransactions(data.results))
      .catch(() => setTransactions([]));
  }, []);

  if (!balance || transactions === null) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-36 w-full rounded-[var(--radius-card)]" />
        <Skeleton className="h-24 w-full rounded-[var(--radius-card)]" />
      </div>
    );
  }

  return (
    <div>
      <h2 className="mb-4 text-xl font-bold">Balans</h2>

      {/* Asosiy raqam — sahifadagi eng katta narsa bo'lsin */}
      <div className="rounded-[var(--radius-card)] bg-ink-900 p-7 text-white dark:bg-ink-100 dark:text-ink-950">
        <p className="text-[11px] font-semibold tracking-[0.09em] uppercase opacity-60">
          Mavjud mablag&apos;
        </p>
        <p className="mt-2 font-display text-4xl font-extrabold tabular-nums sm:text-5xl">
          {formatPrice(Number(balance.amount))}
        </p>
        <p className="mt-3 text-sm opacity-70">
          Har bir sotuvdan platforma ulushi{" "}
          <span className="font-semibold">{balance.commission_percent}%</span>ni
          tashkil qiladi — qolgani shu yerga tushadi.
        </p>
      </div>

      <h3 className="mt-8 mb-3 text-sm font-bold tracking-[0.09em] text-ink-600 uppercase dark:text-ink-400">
        Harakatlar tarixi
      </h3>

      {transactions.length === 0 ? (
        <div className="rounded-[var(--radius-card)] border border-dashed p-10 text-center">
          <p className="font-bold">Hozircha harakat yo&apos;q</p>
          <p className="mx-auto mt-2 max-w-sm text-sm text-ink-600 dark:text-ink-400">
            Mahsulotingiz sotilib, xaridorning to&apos;lovi tasdiqlangach pul shu
            yerda paydo bo&apos;ladi.
          </p>
        </div>
      ) : (
        <ul className="divide-y rounded-[var(--radius-card)] border bg-[var(--surface)]">
          {transactions.map((tx) => (
            <li key={tx.id} className="flex flex-wrap items-start gap-3 p-4">
              <div className="min-w-0 flex-1">
                <p className="font-semibold">
                  {tx.order_number ?? tx.type_display}
                </p>
                <p className="mt-0.5 text-[12px] text-ink-600 dark:text-ink-400">
                  {formatDate(tx.created_at, true)}
                  {Number(tx.commission_amount) > 0 && (
                    <>
                      {" · "}
                      {formatPrice(Number(tx.gross_amount))} sotuv &minus;{" "}
                      {formatPrice(Number(tx.commission_amount))} komissiya
                    </>
                  )}
                </p>
              </div>

              <div className="text-right">
                <p className="font-display font-extrabold text-success tabular-nums">
                  +{formatPrice(Number(tx.amount))}
                </p>
                <p className="text-[12px] text-ink-600 dark:text-ink-400">
                  Balans: {formatPrice(Number(tx.balance_after))}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
