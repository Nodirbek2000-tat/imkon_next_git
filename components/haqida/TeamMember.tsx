"use client";

import { useCallback, useState } from "react";
import { cn } from "@/lib/utils";

export type Member = {
  name: string;
  role: string;
  roleShort: string;
  photo: string;
  /** O'z tilidan aytilgan so'zlar — har bir element alohida abzas */
  quote: string[];
};

/**
 * Jamoa a'zosi kartasi.
 *
 * `flip` — rasmni chap tomonga o'tkazadi. Kartalar navbatma-navbat
 * qarama-qarshi tomonga qaraydi: ro'yxat bir xil qolipda takrorlanib
 * zerikarli bo'lib qolmaydi.
 *
 * Rasm yuklanmasa (fayl hali qo'yilmagan bo'lsa) karta buzilmaydi —
 * ism harfi bilan chiroyli o'rinbosar chiqadi.
 */
export function TeamMember({ member, flip = false }: { member: Member; flip?: boolean }) {
  const [broken, setBroken] = useState(false);

  // Rasm hydration'dan OLDIN yiqilsa `onError` o'tkazib yuboriladi —
  // shuning uchun element ulanganda holatini o'zimiz tekshiramiz.
  const checkLoaded = useCallback((node: HTMLImageElement | null) => {
    if (node?.complete && node.naturalWidth === 0) setBroken(true);
  }, []);

  return (
    <article className="overflow-hidden rounded-[var(--radius-card)] border bg-[var(--surface)] shadow-[var(--shadow-soft)] transition-[transform,box-shadow] duration-500 [transition-timing-function:var(--ease-out-soft)] hover:-translate-y-1 hover:shadow-[var(--shadow-lift)]">
      <div
        className={cn(
          "grid items-center gap-8 p-7 sm:p-9 md:gap-12",
          flip ? "md:grid-cols-[auto_1fr]" : "md:grid-cols-[1fr_auto]",
        )}
      >
        {/* Matn. Telefonda har doim rasmdan keyin — avval yuz, keyin gap */}
        <div className={cn("order-2", flip ? "md:order-2" : "md:order-1")}>
          <span className="inline-flex items-center gap-2 rounded-full bg-brand-600 px-3.5 py-1.5 text-[11px] font-bold tracking-[0.14em] text-white uppercase">
            {member.roleShort}
          </span>

          <h3 className="mt-4 font-display text-[clamp(1.75rem,3.5vw,2.5rem)] leading-[1.05] font-extrabold">
            {member.name}
          </h3>

          <p className="mt-2 text-[15px] font-semibold text-brand-600 dark:text-brand-400">
            {member.role}
          </p>

          {/* O'z so'zlari — iqtibos sifatida */}
          <blockquote className="relative mt-6 max-w-prose border-l-2 border-brand-600/40 pl-5">
            <span
              aria-hidden="true"
              className="absolute -top-4 -left-1 font-display text-5xl leading-none font-extrabold text-brand-600/25 select-none"
            >
              &ldquo;
            </span>
            <div className="space-y-4">
              {member.quote.map((paragraph, i) => (
                <p
                  key={i}
                  className="text-[15px] leading-relaxed text-ink-700 italic dark:text-ink-300"
                >
                  {paragraph}
                </p>
              ))}
            </div>
            <footer className="mt-4 text-[13px] font-semibold text-ink-500 not-italic dark:text-ink-400">
              — {member.name}
            </footer>
          </blockquote>
        </div>

        {/* Rasm */}
        <div className={cn("order-1", flip ? "md:order-1" : "md:order-2")}>
          <div
            className={cn(
              "relative mx-auto w-full max-w-[300px] overflow-hidden rounded-[1.5rem]",
              "aspect-4/5 md:w-[300px]",
              "ring-4 ring-brand-600/15",
            )}
          >
            {broken ? (
              <div
                aria-hidden="true"
                className="grid size-full place-items-center bg-gradient-to-br from-brand-600 to-brand-900"
              >
                <span className="font-display text-6xl font-extrabold text-white">
                  {member.name.charAt(0)}
                </span>
              </div>
            ) : (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                ref={checkLoaded}
                src={member.photo}
                alt={`${member.name} — ${member.role}`}
                onError={() => setBroken(true)}
                className="size-full object-cover"
              />
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
