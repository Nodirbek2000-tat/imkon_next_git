"use client";

import { motion } from "motion/react";
import { LiveDot } from "@/components/ui/Badge";
import type { ApiBid } from "@/lib/api";
import { formatPrice, timeAgo } from "@/lib/utils";

/**
 * Auksiondagi eng yuqori taklif.
 *
 * Auksionda eng muhim ma'lumot — "hozir kim yutyapti va qancha". Bu
 * ikkalasi joriy narx raqamidan alohida, ko'zga tashlanadigan qilib
 * ko'rsatiladi: narx o'zgargani sezilib tursin.
 */
export function LeadingBid({
  bid,
  isLive,
  isMine,
}: {
  bid: ApiBid | undefined;
  isLive: boolean;
  isMine: boolean;
}) {
  if (!bid) {
    return (
      <div className="mt-4 rounded-[var(--radius-card)] border border-dashed p-5 text-center">
        <p className="text-sm font-semibold">Hali hech kim taklif qilmagan</p>
        <p className="mt-1 text-[13px] text-ink-600 dark:text-ink-400">
          Birinchi bo&apos;lib narx taklif qiling.
        </p>
      </div>
    );
  }

  const initial = bid.user_name.trim().charAt(0).toUpperCase() || "?";

  return (
    <motion.div
      // `key` summaga bog'langan — yangi taklif kelganda blok qayta
      // "paydo bo'ladi", ya'ni o'zgarish e'tiborga tashlanadi
      key={bid.amount}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      className="mt-4 overflow-hidden rounded-[var(--radius-card)] bg-ink-900 text-white dark:bg-ink-100 dark:text-ink-950"
    >
      <div className="flex items-center gap-4 p-5">
        <span
          aria-hidden
          className="grid size-12 shrink-0 place-items-center rounded-full bg-brand-600 font-display text-lg font-extrabold text-white"
        >
          {initial}
        </span>

        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-2 text-[11px] font-semibold tracking-[0.12em] uppercase opacity-60">
            {isLive && <LiveDot className="bg-brand-500" />}
            Yetakchi taklif
          </p>
          <p className="mt-1 truncate font-semibold">
            {isMine ? "Siz" : bid.user_name}
            <span className="ml-2 text-[13px] font-normal opacity-60">
              {timeAgo(bid.created_at)}
            </span>
          </p>
        </div>

        <p className="font-display text-2xl font-extrabold tabular-nums sm:text-3xl">
          {formatPrice(Number(bid.amount))}
        </p>
      </div>

      {isMine && (
        <p className="bg-success/20 px-5 py-2 text-[13px] font-semibold text-success">
          Siz yetakchisiz — sizdan oshib ketishmasa lot sizniki.
        </p>
      )}
    </motion.div>
  );
}
