"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useState } from "react";
import { Container } from "@/components/ui/Container";
import { PageHeader, EmptyState, ErrorState } from "@/components/ui/PageHeader";
import { ProductCardSkeleton } from "@/components/ui/Skeleton";
import { ApiProductCard } from "@/components/ApiProductCard";
import { Reveal } from "@/components/ui/Reveal";
import { CategoryBar } from "@/components/catalog/CategoryBar";
import { FilterPanel, EMPTY_FILTERS, type Filters } from "@/components/catalog/FilterPanel";
import { Button } from "@/components/ui/Button";
import { api, ApiError, type ApiCategory, type ApiProduct } from "@/lib/api";

const SORTS = [
  { value: "-created_at", label: "Yangi" },
  { value: "price", label: "Arzon" },
  { value: "-price", label: "Qimmat" },
  { value: "-views_count", label: "Ommabop" },
];

/**
 * `useSearchParams()` Suspense chegarasini talab qiladi.
 *
 * `next dev` bunga e'tibor bermaydi, lekin production build sahifani
 * oldindan chizmoqchi bo'lganda yiqiladi: manzildagi parametrlar faqat
 * brauzerda ma'lum, serverda esa hali yo'q. Suspense Next'ga "bu qismni
 * brauzerda chiz" deb aytadi.
 */
export default function CatalogPage() {
  return (
    <Suspense fallback={<CatalogFallback />}>
      <CatalogContent />
    </Suspense>
  );
}

/** Suspense kutayotganda ko'rinadigan holat — sahifa sakrab ketmasin. */
function CatalogFallback() {
  return (
    <Container className="py-12">
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <ProductCardSkeleton key={i} />
        ))}
      </div>
    </Container>
  );
}

function CatalogContent() {
  const searchParams = useSearchParams();

  const [categories, setCategories] = useState<ApiCategory[]>([]);
  const [products, setProducts] = useState<ApiProduct[]>([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [category, setCategory] = useState("");
  const [search, setSearch] = useState(searchParams.get("search") ?? "");
  const [ordering, setOrdering] = useState("-created_at");
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    api.categories().then(setCategories).catch(() => setCategories([]));
  }, []);

  // Header'dagi qidiruvdan `?search=...` bilan kelinganda ham sinxron bo'lsin
  useEffect(() => {
    setSearch(searchParams.get("search") ?? "");
  }, [searchParams]);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params: Record<string, string> = { ordering };
      if (category) params.category = category;
      if (search.trim()) params.search = search.trim();
      if (filters.minPrice) params.min_price = filters.minPrice;
      if (filters.maxPrice) params.max_price = filters.maxPrice;
      if (filters.region.trim()) params.region = filters.region.trim();
      if (filters.saleType) params.sale_type = filters.saleType;

      const data = await api.products(params);
      setProducts(data.results);
      setCount(data.count);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Yuklab bo'lmadi");
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [category, search, ordering, filters]);

  // Qidiruv/narx maydonlarida har harfda so'rov ketmasin
  useEffect(() => {
    const timer = setTimeout(load, search || filters.minPrice || filters.maxPrice ? 350 : 0);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [load]);

  const activeFilterCount = [filters.minPrice, filters.maxPrice, filters.region, filters.saleType].filter(
    Boolean,
  ).length;

  return (
    <>
      <PageHeader
        eyebrow="Katalog"
        title="Hunarmandlar ishlari"
        description="Har biri qo'lda ishlangan, yagona nusxa. Kategoriya bo'yicha tanlang yoki qidiring."
      />

      <Container className="py-12">
        <div className="mb-8">
          <CategoryBar categories={categories} active={category} onSelect={setCategory} />
        </div>

        <div className="grid gap-8 lg:grid-cols-[260px_1fr]">
          {/* Filtr paneli — desktopda doim ko'rinadi, mobilda ochiladi */}
          <aside className={showFilters ? "block" : "hidden lg:block"}>
            <FilterPanel filters={filters} onChange={setFilters} />
          </aside>

          <div>
            <div className="mb-6 flex flex-wrap items-center gap-3">
              <div className="relative min-w-64 flex-1">
                <label htmlFor="search" className="sr-only">
                  Qidirish
                </label>
                <input
                  id="search"
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Mahsulot yoki hunarmand nomi…"
                  className="h-12 w-full rounded-full border-2 border-[var(--line)] bg-[var(--surface)] pr-4 pl-12 text-[15px] transition-colors duration-300 outline-none focus:border-brand-600"
                />
                <svg
                  className="absolute top-1/2 left-4 -translate-y-1/2 text-ink-400"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  aria-hidden="true"
                >
                  <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
                  <path d="m20 20-3.5-3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </div>

              <Button
                type="button"
                variant="outline"
                size="md"
                className="lg:hidden"
                onClick={() => setShowFilters((s) => !s)}
              >
                Filtrlar{activeFilterCount > 0 && ` (${activeFilterCount})`}
              </Button>

              <div>
                <label htmlFor="ordering" className="sr-only">
                  Tartiblash
                </label>
                <select
                  id="ordering"
                  value={ordering}
                  onChange={(e) => setOrdering(e.target.value)}
                  className="h-12 rounded-full border-2 border-[var(--line)] bg-[var(--surface)] px-5 text-[15px] font-medium transition-colors duration-300 outline-none focus:border-brand-600"
                >
                  {SORTS.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Natijalar */}
            {loading ? (
              <ul className="grid grid-cols-2 gap-4 lg:grid-cols-4 lg:gap-5">
                {Array.from({ length: 8 }).map((_, i) => (
                  <li key={i}>
                    <ProductCardSkeleton />
                  </li>
                ))}
              </ul>
            ) : error ? (
              <ErrorState message={error} onRetry={load} />
            ) : products.length === 0 ? (
              <EmptyState
                title="Hech narsa topilmadi"
                hint="Boshqa kategoriya tanlang yoki qidiruvni o'zgartiring."
              />
            ) : (
              <>
                <p className="mb-6 text-sm text-ink-600 dark:text-ink-400">
                  {count} ta mahsulot topildi
                </p>
                <ul className="grid grid-cols-2 gap-4 lg:grid-cols-4 lg:gap-5">
                  {products.map((product, i) => (
                    <li key={product.id}>
                      <Reveal delay={Math.min(i, 7) * 0.06}>
                        <ApiProductCard product={product} />
                      </Reveal>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        </div>
      </Container>
    </>
  );
}
