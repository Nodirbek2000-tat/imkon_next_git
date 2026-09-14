"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { useAuth } from "@/components/auth/AuthProvider";
import { useCart } from "@/components/cart/CartProvider";
import { api } from "@/lib/api";
import { cn, formatPrice } from "@/lib/utils";
import type { ApiProduct } from "@/lib/api";

/** Rasm yo'q bo'lsa — slug'dan barqaror gradient. Har safar bir xil chiqadi. */
function gradientFor(slug: string) {
  const palette = [
    ["#f0334d", "#d99a2b"],
    ["#b9122c", "#fb6478"],
    ["#490611", "#f0334d"],
    ["#a06d14", "#f1cd7e"],
    ["#dc1b38", "#831528"],
    ["#9a1329", "#d99a2b"],
  ];
  let hash = 0;
  for (const char of slug) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return palette[hash % palette.length];
}

export function ApiProductCard({ product }: { product: ApiProduct }) {
  const [from, to] = gradientFor(product.slug);
  const [active, setActive] = useState(0);

  // Backend `gallery`ni beradi, lekin eski javoblar (yoki rasmi yo'q
  // mahsulot) uchun asosiy rasmga qaytamiz
  const images = useMemo(() => {
    if (product.gallery?.length) return product.gallery;
    return product.main_image ? [product.main_image] : [];
  }, [product.gallery, product.main_image]);

  const current = images[active] ?? images[0] ?? null;

  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-2xl border bg-[var(--surface)] shadow-[var(--shadow-soft)] transition-[transform,box-shadow] duration-500 [transition-timing-function:var(--ease-out-soft)] hover:-translate-y-1 hover:shadow-[var(--shadow-lift)]">
      <Link href={`/mahsulot/${product.slug}`} className="block">
        <div
          className="relative aspect-square overflow-hidden bg-ink-100 dark:bg-ink-800"
          onMouseLeave={() => setActive(0)}
        >
          {current ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={current.url}
              alt={current.alt || product.title}
              className="size-full object-cover"
              loading="lazy"
            />
          ) : (
            <div
              className="grain size-full"
              style={{ background: `linear-gradient(135deg, ${from}, ${to})` }}
              aria-hidden="true"
            />
          )}

          {/*
            Rasm nechta bo'lsa, rasm maydoni shuncha teng bo'lakka bo'linadi.
            Sichqoncha qaysi bo'lak ustida bo'lsa — o'sha rasm ko'rinadi.
            Bo'laklar shaffof, ular faqat sichqonchani ushlaydi.
          */}
          {images.length > 1 && (
            <>
              <div className="absolute inset-0 flex">
                {images.map((image, index) => (
                  <span
                    key={image.url}
                    onMouseEnter={() => setActive(index)}
                    className="h-full flex-1"
                    aria-hidden="true"
                  />
                ))}
              </div>

              {/* Nechanchi rasm ekani — sichqoncha kelganda ko'rinadi */}
              <div className="pointer-events-none absolute right-2 bottom-2 left-2 flex gap-1 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                {images.map((image, index) => (
                  <span
                    key={image.url}
                    className={cn(
                      "h-0.5 flex-1 rounded-full transition-colors duration-200",
                      index === active ? "bg-brand-600" : "bg-white/60 dark:bg-ink-100/40",
                    )}
                  />
                ))}
              </div>
            </>
          )}

          <div className="pointer-events-none absolute top-2 left-2 flex flex-wrap gap-1.5">
            <Badge tone="brand" className="px-2 py-0.5 text-[10px]">
              {product.category?.name ?? "Boshqa"}
            </Badge>
            {product.has_auction && (
              <Badge tone="gold" className="px-2 py-0.5 text-[10px]">
                Auksion
              </Badge>
            )}
          </div>

          <FavoriteButton slug={product.slug} initial={product.is_favorited} />
        </div>
      </Link>

      {/*
        Tartib Uzum'dagidek: avval narx, keyin nom, keyin sharhlar.
        Xaridor ro'yxatni ko'zdan kechirayotganda birinchi navbatda
        narxni solishtiradi — shuning uchun u eng tepada va eng yirik.
      */}
      <div className="flex flex-1 flex-col gap-1.5 p-3">
        <p className="font-display text-[17px] leading-none font-extrabold">
          {formatPrice(Number(product.price))}
        </p>

        <Link href={`/mahsulot/${product.slug}`} className="block">
          <h3 className="line-clamp-2 text-[13px] leading-snug transition-colors duration-300 group-hover:text-brand-600">
            {product.title}
          </h3>
        </Link>

        {/* Balandligi doim band — reytingi bor va yo'q kartalar bir xil
            bo'yda qatorda tekis tursin */}
        <div className="flex min-h-4 items-center gap-1 text-[12px]">
          {product.rating_count > 0 && product.rating_avg !== null ? (
            <>
              <StarIcon className="text-gold-500" />
              <span className="font-semibold">{product.rating_avg.toFixed(1)}</span>
              <span className="text-ink-500 dark:text-ink-400">
                ({product.rating_count} sharh)
              </span>
            </>
          ) : (
            <span className="text-ink-400 dark:text-ink-500">Sharh yo&apos;q</span>
          )}
        </div>

        <div className="mt-auto pt-2">
          <CartControl product={product} />
        </div>
      </div>
    </article>
  );
}

/**
 * "Savatga" tugmasi — bosilgach miqdor boshqaruviga aylanadi.
 *
 * Miqdor savatning o'zidan o'qiladi (`useCart`), kartaning ichki holatidan
 * emas: xuddi shu mahsulot bir nechta joyda ko'rinishi mumkin (katalog,
 * "sevimlilar", do'kon sahifasi) va hammasi bir xil sonni ko'rsatishi kerak.
 */
function CartControl({ product }: { product: ApiProduct }) {
  const router = useRouter();
  const { user } = useAuth();
  const { items, addItem, updateItem, removeItem } = useCart();
  const [busy, setBusy] = useState(false);

  const line = items.find((item) => item.product.slug === product.slug);
  const quantity = line?.quantity ?? 0;

  const soldOut = product.stock <= 0 || product.status === "sold";
  const atLimit = quantity >= product.stock;

  // Auksion loti savatga tushmaydi — narxni xaridorlar belgilaydi
  if (product.has_auction) {
    return (
      <Link
        href={`/mahsulot/${product.slug}`}
        className="flex h-9 w-full items-center justify-center rounded-full border-2 border-ink-900 text-[13px] font-semibold transition-colors duration-300 hover:bg-ink-900 hover:text-white dark:border-ink-100 dark:hover:bg-ink-100 dark:hover:text-ink-950"
      >
        Auksionga o&apos;tish
      </Link>
    );
  }

  if (soldOut) {
    return (
      <span className="flex h-9 w-full items-center justify-center rounded-full bg-ink-100 text-[13px] font-semibold text-ink-500 dark:bg-ink-800 dark:text-ink-400">
        Sotib bo&apos;lingan
      </span>
    );
  }

  const guard = () => {
    if (user) return true;
    router.push(`/kirish?next=${encodeURIComponent(`/mahsulot/${product.slug}`)}`);
    return false;
  };

  const add = async () => {
    if (!guard() || busy) return;
    setBusy(true);
    try {
      await addItem(product.slug, 1);
    } finally {
      setBusy(false);
    }
  };

  const change = async (next: number) => {
    if (!line || busy) return;
    setBusy(true);
    try {
      if (next <= 0) await removeItem(line.id);
      else await updateItem(line.id, next);
    } finally {
      setBusy(false);
    }
  };

  if (quantity === 0) {
    return (
      <button
        type="button"
        onClick={add}
        disabled={busy}
        className="flex h-9 w-full items-center justify-center gap-2 rounded-full bg-brand-600 text-[13px] font-semibold text-white transition-[background-color,transform] duration-300 hover:bg-brand-700 active:scale-[0.97] disabled:opacity-60"
      >
        <CartIcon />
        Savatga
      </button>
    );
  }

  return (
    <div className="flex h-9 w-full items-center justify-between rounded-full bg-brand-600 px-1 text-white">
      <button
        type="button"
        onClick={() => change(quantity - 1)}
        disabled={busy}
        aria-label={quantity === 1 ? "Savatdan olib tashlash" : "Kamaytirish"}
        className="grid size-7 place-items-center rounded-full text-lg leading-none font-bold transition-colors duration-200 hover:bg-white/20 disabled:opacity-60"
      >
        {quantity === 1 ? <TrashIcon /> : "−"}
      </button>

      <span className="text-[13px] font-bold tabular-nums">{quantity}</span>

      <button
        type="button"
        onClick={() => change(quantity + 1)}
        disabled={busy || atLimit}
        aria-label="Ko'paytirish"
        title={atLimit ? `Zaxirada ${product.stock} ta bor` : undefined}
        className="grid size-7 place-items-center rounded-full text-lg leading-none font-bold transition-colors duration-200 hover:bg-white/20 disabled:opacity-40"
      >
        +
      </button>
    </div>
  );
}

function FavoriteButton({ slug, initial }: { slug: string; initial: boolean }) {
  const router = useRouter();
  const { user } = useAuth();
  const [favorited, setFavorited] = useState(initial);
  const [busy, setBusy] = useState(false);

  const toggle = async (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();

    if (!user) {
      router.push(`/kirish?next=${encodeURIComponent(`/mahsulot/${slug}`)}`);
      return;
    }
    if (busy) return;

    setBusy(true);
    setFavorited((f) => !f);
    try {
      const result = await api.toggleFavorite(slug);
      setFavorited(result.favorited);
    } catch {
      setFavorited((f) => !f);
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={favorited}
      aria-label={favorited ? "Sevimlilardan olib tashlash" : "Sevimlilarga qo'shish"}
      className="absolute top-2 right-2 grid size-8 place-items-center rounded-full bg-white/90 text-ink-700 shadow-sm backdrop-blur-sm transition-transform duration-200 hover:scale-110 dark:bg-ink-950/80 dark:text-ink-200"
    >
      <HeartIcon filled={favorited} className={cn(favorited && "text-brand-600")} />
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
      className={cn("size-4", className)}
      aria-hidden="true"
    >
      <path
        d="M12 21s-7.5-4.6-10-9.2C.5 8.4 2.3 5 5.8 5c2 0 3.4 1 4.2 2.2C10.8 6 12.2 5 14.2 5c3.5 0 5.3 3.4 3.8 6.8-2.5 4.6-10 9.2-10 9.2Z"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function StarIcon({ className }: { className?: string }) {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M12 2.5 15 9l7 1-5.2 5 1.3 7-6.1-3.4L5.9 22l1.3-7L2 10l7-1 3-6.5Z" />
    </svg>
  );
}

function CartIcon() {
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
      <path d="M3 4h2l2.4 11.2a2 2 0 0 0 2 1.6h7.7a2 2 0 0 0 2-1.5L21 8H6" />
      <circle cx="10" cy="20" r="1.2" fill="currentColor" stroke="none" />
      <circle cx="18" cy="20" r="1.2" fill="currentColor" stroke="none" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      className="size-4"
      aria-hidden="true"
    >
      <path d="M4 7h16M9 7V5h6v2M6 7l1 13h10l1-13" />
    </svg>
  );
}
