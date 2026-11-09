"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Container } from "@/components/ui/Container";
import { PageHeader, EmptyState, ErrorState } from "@/components/ui/PageHeader";
import { ProductCardSkeleton } from "@/components/ui/Skeleton";
import { ApiProductCard } from "@/components/ApiProductCard";
import { Reveal } from "@/components/ui/Reveal";
import { api, ApiError, type ApiProduct } from "@/lib/api";
import { cn } from "@/lib/utils";

/**
 * "Reyting" — eng ko'p ovoz yig'gan ishlar.
 *
 * Tartibni backend beradi (`/api/products/top/`): u `likes_count` bo'yicha
 * saralaydi va teng ovozdagilar orasida yangirog'ini oldinga qo'yadi.
 * Bu yerda qayta saralanmaydi — aks holda sahifalash buzilardi.
 */
export default function ReytingPage() {
  const [products, setProducts] = useState<ApiProduct[] | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .topProducts()
      .then((data) => setProducts(data.results))
      .catch((err) => {
        setError(err instanceof ApiError ? err.message : "Yuklab bo'lmadi");
        setProducts([]);
      });
  }, []);

  // Hech kim hali ovoz bermagan bo'lsa — foydalanuvchini taklif qilamiz
  const noVotesYet =
    products !== null && products.length > 0 && products[0].likes_count === 0;

  // Peshqadam — faqat haqiqiy ovoz bo'lsa ko'rsatiladi. Hammasi 0 bo'lganda
  // birinchi kartani "g'olib" deb ko'rsatish adolatsiz bo'lardi.
  const leader = products?.length && products[0].likes_count > 0 ? products[0] : null;

  return (
    <>
      <PageHeader
        eyebrow="Ovoz berish"
        title="Reyting"
        description="Eng ko'p ovoz yig'gan ishlar eng tepada. Yoqqan ishga yurakcha bosing — ovozingiz shu ro'yxatni belgilaydi."
      />

      <Container className="py-10">
        {products === null ? (
          <ul className="grid grid-cols-2 gap-4 lg:grid-cols-4 lg:gap-5">
            {Array.from({ length: 8 }).map((_, i) => (
              <li key={i}>
                <ProductCardSkeleton />
              </li>
            ))}
          </ul>
        ) : error ? (
          <ErrorState message={error} />
        ) : products.length === 0 ? (
          <EmptyState
            icon="♥"
            title="Hozircha ish yo'q"
            hint="Mahsulotlar qo'shilgach reyting shu yerda paydo bo'ladi."
          />
        ) : (
          <>
            {leader && <Leader product={leader} />}

            {noVotesYet && (
              <p className="mb-6 rounded-[var(--radius-card)] border-2 border-dashed border-brand-600/40 px-5 py-4 text-center text-[15px] text-ink-600 dark:text-ink-400">
                Hali hech kim ovoz bermagan — <strong>birinchi bo&apos;ling!</strong>{" "}
                Yurakcha bosilgan zahoti ish shu ro&apos;yxatda yuqoriga ko&apos;tariladi.
              </p>
            )}

            <ul className="grid grid-cols-2 gap-4 lg:grid-cols-4 lg:gap-5">
              {products.map((product, index) => (
                <li key={product.id} className="relative">
                  <RankBadge rank={index + 1} />
                  <Reveal delay={Math.min(index, 7) * 0.06}>
                    <ApiProductCard product={product} />
                  </Reveal>
                </li>
              ))}
            </ul>
          </>
        )}
      </Container>
    </>
  );
}

/**
 * Peshqadam — eng ko'p ovoz yig'gan ish va uning EGASI.
 *
 * Reytingning asosiy maqsadi shu: bola (yoki hunarmand) o'z ishi
 * qancha ovoz yig'ganini ko'rsin. Shuning uchun bu yerda mahsulot
 * nomidan ko'ra muallif nomi kattaroq turadi.
 */
function Leader({ product }: { product: ApiProduct }) {
  const image = product.main_image ?? product.gallery?.[0] ?? null;

  return (
    <Reveal>
      <Link
        href={`/mahsulot/${product.slug}`}
        className="group mb-8 flex flex-col gap-5 overflow-hidden rounded-[var(--radius-card)] border-2 border-gold-500/50 bg-[var(--surface)] p-5 shadow-[var(--shadow-soft)] transition-shadow duration-500 hover:shadow-[var(--shadow-lift)] sm:flex-row sm:items-center sm:p-6"
      >
        <div className="relative size-full shrink-0 overflow-hidden rounded-2xl bg-ink-100 sm:size-36 dark:bg-ink-800">
          {image ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={image.url}
              alt={image.alt || product.title}
              className="aspect-square size-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
          ) : (
            <div className="aspect-square size-full bg-gradient-to-br from-brand-600 to-gold-500" />
          )}
          <span className="absolute top-2 left-2 rounded-full bg-gold-500 px-2 py-0.5 text-[11px] font-extrabold text-ink-950">
            1-o&apos;rin
          </span>
        </div>

        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-2 text-[11px] font-semibold tracking-[0.16em] text-gold-700 uppercase dark:text-gold-300">
            <TrophyIcon />
            Eng ko&apos;p ovoz yig&apos;gan ish
          </p>

          <p className="mt-2 font-display text-2xl leading-tight font-extrabold transition-colors group-hover:text-brand-600 sm:text-3xl">
            {product.artisan.shop_name}
          </p>

          <p className="mt-1 text-[15px] text-ink-600 dark:text-ink-400">
            {product.artisan.kind === "student" ? "O'quvchi" : "Hunarmand"} ·{" "}
            <span className="font-medium text-ink-800 dark:text-ink-200">
              {product.title}
            </span>
          </p>

          <p className="mt-3 inline-flex items-center gap-2 rounded-full bg-brand-600 px-4 py-1.5 text-[15px] font-bold text-white">
            <HeartFilledIcon />
            {product.likes_count} ta ovoz
          </p>
        </div>
      </Link>
    </Reveal>
  );
}

function TrophyIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="size-4"
      aria-hidden="true"
    >
      <path d="M7 4h10v5a5 5 0 0 1-10 0V4Z" />
      <path d="M7 6H4v1a3 3 0 0 0 3 3M17 6h3v1a3 3 0 0 1-3 3" />
      <path d="M12 14v4M9 20h6" />
    </svg>
  );
}

function HeartFilledIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="size-4" aria-hidden="true">
      <path d="M12 21s-7.5-4.6-10-9.2C.5 8.4 2.3 5 5.8 5c2 0 3.4 1 4.2 2.2C10.8 6 12.2 5 14.2 5c3.5 0 5.3 3.4 3.8 6.8-2.5 4.6-10 9.2-10 9.2Z" />
    </svg>
  );
}

/**
 * O'rin belgisi.
 *
 * Kartaning chap yuqorisida kategoriya yorlig'i turibdi, shuning uchun
 * raqam kartadan tashqariga chiqarilgan (`-top-2 -left-2`) — ikkalasi
 * bir-birining ustiga tushmaydi.
 */
function RankBadge({ rank }: { rank: number }) {
  const medal =
    rank === 1
      ? "bg-gold-500 text-ink-950 ring-gold-300"
      : rank === 2
        ? "bg-ink-300 text-ink-950 ring-ink-100"
        : rank === 3
          ? "bg-gold-700 text-white ring-gold-500"
          : "bg-ink-900 text-ink-100 ring-ink-700 dark:bg-ink-100 dark:text-ink-950 dark:ring-ink-300";

  return (
    <span
      className={cn(
        "absolute -top-2 -left-2 z-10 grid size-8 place-items-center rounded-full text-[13px] font-extrabold ring-2 shadow-[var(--shadow-soft)]",
        medal,
      )}
      aria-label={`${rank}-o'rin`}
    >
      {rank}
    </span>
  );
}
