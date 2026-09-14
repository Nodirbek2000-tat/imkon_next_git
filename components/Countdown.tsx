"use client";

import { useEffect, useState } from "react";
import { pad, timeLeft } from "@/lib/utils";
import { cn } from "@/lib/utils";

/**
 * Jonli taymer.
 *
 * Server va klient vaqti bir xil emas — shuning uchun mount'gacha
 * hech narsa chizilmaydi (`undefined` holati). Bu hydration mismatch'ning
 * oldini oladi.
 */
export function Countdown({
  endAt,
  className,
  onEnd,
}: {
  endAt: string;
  className?: string;
  onEnd?: () => void;
}) {
  const [left, setLeft] = useState<ReturnType<typeof timeLeft> | undefined>();

  useEffect(() => {
    const end = new Date(endAt);
    let ended = false;

    const tick = () => {
      const next = timeLeft(end);
      setLeft(next);
      if (next === null && !ended) {
        ended = true;
        onEnd?.();
      }
    };

    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [endAt, onEnd]);

  if (left === undefined) {
    return <span className={cn("animate-shimmer text-ink-400", className)}>--:--:--</span>;
  }

  if (left === null) {
    return <span className={cn("text-ink-400", className)}>Tugadi</span>;
  }

  const urgent = left.total < 6 * 3_600_000;

  return (
    <span className={cn("tabular-nums", urgent && "text-brand-600", className)}>
      {left.days > 0 && `${left.days}k `}
      {pad(left.hours)}:{pad(left.minutes)}:{pad(left.seconds)}
    </span>
  );
}
