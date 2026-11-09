"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

/**
 * Ommaviy "layk" tugmasi — Instagram'dagidek yurakcha va yonida soni.
 *
 * "Sevimlilar" (yuqori o'ng burchakdagi xatcho'p) bilan ADASHTIRMANG:
 * u shaxsiy ro'yxat, soni hech kimga ko'rinmaydi. Layk esa ovoz —
 * soni hamma ko'radi va "Reyting" bo'limi shunga qarab tuziladi.
 *
 * Son tugma bosilishi bilan darhol o'zgaradi (optimistik), server javobi
 * kelgach aniq qiymatga tenglashadi: boshqa birov ayni paytda layk bosgan
 * bo'lsa ham raqam to'g'ri qoladi. Xato bo'lsa eski holatga qaytadi.
 */
export function LikeButton({
  slug,
  initialLiked,
  initialCount,
  size = "sm",
}: {
  slug: string;
  initialLiked: boolean;
  initialCount: number;
  size?: "sm" | "lg";
}) {
  const router = useRouter();
  const { user } = useAuth();
  const [liked, setLiked] = useState(initialLiked);
  const [count, setCount] = useState(initialCount);
  const [busy, setBusy] = useState(false);
  const [pop, setPop] = useState(false);

  const toggle = async (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();

    // Mehmon ovoz bera olmaydi — kim bergani hisobga olinishi kerak,
    // aks holda bitta odam sahifani yangilab reytingni ko'tarib ketardi
    if (!user) {
      router.push(`/kirish?next=${encodeURIComponent(`/mahsulot/${slug}`)}`);
      return;
    }
    if (busy) return;

    const previous = { liked, count };
    setLiked(!liked);
    setCount((n) => Math.max(0, n + (liked ? -1 : 1)));
    if (!liked) {
      setPop(true);
      setTimeout(() => setPop(false), 320);
    }
    setBusy(true);

    try {
      const result = await api.toggleLike(slug);
      setLiked(result.liked);
      setCount(result.likes_count);
    } catch (error) {
      setLiked(previous.liked);
      setCount(previous.count);
      // 401 — tizimga kirmagan. Kirgandan keyin shu mahsulotga qaytadi.
      if ((error as { status?: number })?.status === 401) {
        router.push(`/kirish?next=${encodeURIComponent(`/mahsulot/${slug}`)}`);
      }
    } finally {
      setBusy(false);
    }
  };

  const large = size === "lg";

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={liked}
      aria-label={liked ? "Ovozni qaytarib olish" : "Ovoz berish"}
      title={liked ? "Ovozingizni qaytarib olish" : "Bu ishga ovoz berish"}
      className={cn(
        "group/like flex shrink-0 items-center gap-1 rounded-full transition-colors duration-200",
        large
          ? "h-11 border-2 border-brand-600 px-5 text-[15px] font-semibold text-brand-600 hover:bg-brand-600 hover:text-white"
          : "text-[12px] text-ink-500 hover:text-brand-600 dark:text-ink-400",
        liked && !large && "text-brand-600 dark:text-brand-500",
        liked && large && "bg-brand-600 text-white",
      )}
    >
      <HeartIcon
        filled={liked}
        className={cn(
          large ? "size-5" : "size-3.5",
          // Bosilganda yurakcha bir sakrab qo'yadi
          pop && "scale-125",
          "transition-transform duration-200 group-hover/like:scale-110",
        )}
      />
      <span className="font-semibold tabular-nums">{count}</span>
    </button>
  );
}

function HeartIcon({ filled, className }: { filled: boolean; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="2"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M12 21s-7.5-4.6-10-9.2C.5 8.4 2.3 5 5.8 5c2 0 3.4 1 4.2 2.2C10.8 6 12.2 5 14.2 5c3.5 0 5.3 3.4 3.8 6.8-2.5 4.6-10 9.2-10 9.2Z"
        strokeLinejoin="round"
      />
    </svg>
  );
}
