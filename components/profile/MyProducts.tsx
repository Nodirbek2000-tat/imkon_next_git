"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ProductCardSkeleton } from "@/components/ui/Skeleton";
import { api, ApiError, type ApiProduct } from "@/lib/api";
import { formatPrice } from "@/lib/utils";

const STATUS_LABEL: Record<string, { text: string; tone: "brand" | "gold" | "neutral" }> = {
  draft: { text: "Qoralama", tone: "neutral" },
  active: { text: "Sotuvda", tone: "brand" },
  sold: { text: "Sotilgan", tone: "gold" },
  archived: { text: "Arxiv", tone: "neutral" },
};

export function MyProducts() {
  const [products, setProducts] = useState<ApiProduct[] | null>(null);
  const [error, setError] = useState("");
  const [busySlug, setBusySlug] = useState("");

  const load = useCallback(async () => {
    try {
      const data = await api.myProducts();
      setProducts(data.results);
    } catch {
      setProducts([]);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const markSold = async (slug: string) => {
    setError("");
    setBusySlug(slug);
    try {
      await api.updateProduct(slug, { status: "sold" });
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Belgilanmadi");
    } finally {
      setBusySlug("");
    }
  };

  const remove = async (slug: string, title: string) => {
    if (!window.confirm(`“${title}” o'chirilsinmi? Bu amalni qaytarib bo'lmaydi.`)) return;
    setError("");
    setBusySlug(slug);
    try {
      await api.deleteProduct(slug);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "O'chirilmadi");
    } finally {
      setBusySlug("");
    }
  };

  if (products === null) {
    return (
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <ProductCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-ink-600 dark:text-ink-400">
          {products.length} ta mahsulot
        </p>
        <Button href="/mahsulot/yangi" size="sm">
          + Yangi ish qo&apos;shish
        </Button>
      </div>

      {error && (
        <p role="alert" className="mb-4 font-medium text-brand-600">
          {error}
        </p>
      )}

      {products.length === 0 ? (
        <div className="rounded-[var(--radius-card)] border border-dashed p-10 text-center">
          <p className="font-semibold">Hali mahsulot qo&apos;shmagansiz</p>
          <p className="mt-1 text-sm text-ink-600 dark:text-ink-400">
            Birinchi ishingizni qo&apos;shing — u darhol katalogda ko&apos;rinadi.
          </p>
        </div>
      ) : (
        <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => {
            const status = STATUS_LABEL[product.status] ?? STATUS_LABEL.draft;
            const busy = busySlug === product.slug;
            return (
              <li key={product.id}>
                {/* Egalik amallari <Link> ICHIDA emas — karta va tugmalar
                    yonma-yon turadi, bosishlar aralashmaydi */}
                <article className="flex h-full flex-col overflow-hidden rounded-[var(--radius-card)] border bg-[var(--surface)] shadow-[var(--shadow-soft)]">
                  <Link
                    href={`/mahsulot/${product.slug}`}
                    className="group relative block aspect-4/3 overflow-hidden"
                  >
                    {product.main_image ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={product.main_image.url}
                        alt={product.main_image.alt || product.title}
                        className="size-full object-cover transition-transform duration-700 group-hover:scale-105"
                        loading="lazy"
                      />
                    ) : (
                      <div
                        aria-hidden="true"
                        className="grain size-full bg-gradient-to-br from-brand-500 to-gold-500"
                      />
                    )}
                    <div className="absolute top-3 left-3 flex gap-2">
                      <Badge tone={status.tone}>{status.text}</Badge>
                      {product.has_auction && <Badge tone="gold">Auksion</Badge>}
                    </div>
                  </Link>

                  <div className="flex flex-1 flex-col p-4">
                    <h3 className="leading-snug font-bold">
                      <Link
                        href={`/mahsulot/${product.slug}`}
                        className="transition-colors hover:text-brand-600"
                      >
                        {product.title}
                      </Link>
                    </h3>
                    <p className="mt-1 font-display text-lg font-extrabold">
                      {formatPrice(Number(product.price))}
                    </p>

                    <div className="mt-auto flex flex-wrap gap-2 pt-4">
                      <Button
                        href={`/mahsulot/${product.slug}/tahrirlash`}
                        size="sm"
                        variant="outline"
                      >
                        Tahrirlash
                      </Button>
                      {product.status === "active" && (
                        <Button
                          type="button"
                          size="sm"
                          disabled={busy}
                          onClick={() => markSold(product.slug)}
                        >
                          {busy ? "…" : "Sotildi"}
                        </Button>
                      )}
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        disabled={busy}
                        onClick={() => remove(product.slug, product.title)}
                        className="text-brand-600"
                      >
                        O&apos;chirish
                      </Button>
                    </div>
                  </div>
                </article>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
