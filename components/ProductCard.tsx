import Link from "next/link";
import { Artwork } from "@/components/ui/Artwork";
import { Badge } from "@/components/ui/Badge";
import { formatPrice } from "@/lib/utils";
import type { Product } from "@/lib/mock";

export function ProductCard({ product }: { product: Product }) {
  return (
    <article className="group relative">
      {/*
        Bu karta bosh sahifadagi bezak — ichidagi ma'lumot namuna, bazada
        bunday mahsulot bo'lmasligi mumkin. Shuning uchun havola katalogga
        olib boradi: mavjud bo'lmagan mahsulot sahifasiga yuborsak 404 chiqardi.
      */}
      <Link
        href="/katalog"
        className="block overflow-hidden rounded-[var(--radius-card)] border bg-[var(--surface)] shadow-[var(--shadow-soft)] transition-[transform,box-shadow] duration-500 [transition-timing-function:var(--ease-out-soft)] group-hover:-translate-y-1.5 group-hover:shadow-[var(--shadow-lift)]"
      >
        <div className="relative">
          <Artwork
            art={product.art}
            image={product.image}
            alt={product.title}
            className="aspect-square"
          />

          <div className="absolute top-2.5 left-2.5">
            <Badge tone="brand" className="px-2 py-0.5 text-[10px]">
              {product.category}
            </Badge>
          </div>
        </div>

        <div className="p-3.5">
          <p className="truncate text-[12px] font-medium text-ink-600 dark:text-ink-400">
            {product.seller.name} · {product.seller.region}
          </p>

          <h3 className="mt-1 line-clamp-2 text-[14px] leading-snug font-bold transition-colors duration-300 group-hover:text-brand-600">
            {product.title}
          </h3>

          <div className="mt-3 flex items-center justify-between gap-2">
            <span className="font-display text-base font-extrabold">
              {formatPrice(product.price)}
            </span>

            <span
              aria-hidden="true"
              className="grid size-8 shrink-0 place-items-center rounded-full bg-ink-100 text-ink-700 transition-all duration-400 [transition-timing-function:var(--ease-spring)] group-hover:bg-brand-600 group-hover:text-white dark:bg-ink-800 dark:text-ink-200"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path
                  d="M3 8h10M9 4l4 4-4 4"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
          </div>
        </div>
      </Link>
    </article>
  );
}
