"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Container } from "@/components/ui/Container";
import { PageHeader, EmptyState, ErrorState } from "@/components/ui/PageHeader";
import { Skeleton } from "@/components/ui/Skeleton";
import { Reveal } from "@/components/ui/Reveal";
import { Badge } from "@/components/ui/Badge";
import { api, ApiError, type ApiArtisan } from "@/lib/api";

export default function ArtisansPage() {
  const [artisans, setArtisans] = useState<ApiArtisan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params: Record<string, string> = {};
      if (search.trim()) params.search = search.trim();
      const data = await api.artisans(params);
      setArtisans(data.results);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Yuklab bo'lmadi");
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    const timer = setTimeout(load, search ? 350 : 0);
    return () => clearTimeout(timer);
  }, [load, search]);

  return (
    <>
      <PageHeader
        eyebrow="Hunarmandlar"
        title="Ish ortidagi insonlar"
        description="Har bir buyum ortida o'z hikoyasi bo'lgan hunarmand turadi. Profiliga kiring, ishlarini va postlarini ko'ring."
      />

      <Container className="py-12">
        <div className="relative mb-10 max-w-lg">
          <label htmlFor="artisan-search" className="sr-only">
            Hunarmand qidirish
          </label>
          <input
            id="artisan-search"
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Ism, do'kon yoki viloyat…"
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

        {loading ? (
          <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <li key={i} className="rounded-[var(--radius-card)] border p-6">
                <Skeleton className="size-16 rounded-2xl" />
                <Skeleton className="mt-4 h-6 w-2/3" />
                <Skeleton className="mt-2 h-4 w-1/3" />
                <Skeleton className="mt-5 h-12 w-full" />
              </li>
            ))}
          </ul>
        ) : error ? (
          <ErrorState message={error} onRetry={load} />
        ) : artisans.length === 0 ? (
          <EmptyState title="Hunarmand topilmadi" hint="Boshqa so'z bilan qidirib ko'ring." />
        ) : (
          <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {artisans.map((artisan, i) => (
              <li key={artisan.id}>
                <Reveal delay={Math.min(i, 5) * 0.07}>
                  <ArtisanCard artisan={artisan} />
                </Reveal>
              </li>
            ))}
          </ul>
        )}
      </Container>
    </>
  );
}

function ArtisanCard({ artisan }: { artisan: ApiArtisan }) {
  return (
    <article className="group h-full">
      <Link
        href={`/hunarmandlar/${artisan.slug}`}
        className="flex h-full flex-col overflow-hidden rounded-[var(--radius-card)] border bg-[var(--surface)] shadow-[var(--shadow-soft)] transition-[transform,box-shadow] duration-500 [transition-timing-function:var(--ease-out-soft)] hover:-translate-y-1.5 hover:shadow-[var(--shadow-lift)]"
      >
        <div className="flex flex-1 flex-col p-6">
          <div className="mb-4">
            {artisan.user.avatar ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={artisan.user.avatar}
                alt=""
                className="size-16 rounded-2xl object-cover"
              />
            ) : (
              <span className="grid size-16 place-items-center rounded-2xl bg-ink-900 font-display text-2xl font-extrabold text-white dark:bg-ink-100 dark:text-ink-950">
                {artisan.shop_name.charAt(0)}
              </span>
            )}
          </div>

          <h2 className="text-xl leading-snug font-bold transition-colors duration-300 group-hover:text-brand-600">
            {artisan.shop_name}
          </h2>
          {/* Ismi yoki viloyati bo'lmasligi mumkin — bo'sh qiymat "· Namangan"
              kabi osilib qolgan ajratgich qoldirmasin */}
          <p className="mt-1 text-[14px] text-ink-600 dark:text-ink-400">
            {[artisan.user.full_name, artisan.region].filter(Boolean).join(" · ")}
          </p>

          {artisan.crafts.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {artisan.crafts.slice(0, 2).map((craft) => (
                <Badge key={craft.id} tone="brand">
                  {craft.icon} {craft.name}
                </Badge>
              ))}
            </div>
          )}

          <dl className="mt-auto grid grid-cols-3 gap-2 border-t pt-5 text-center">
            <Stat value={artisan.products_count} label="Ish" />
            <Stat value={artisan.posts_count} label="Post" />
            <Stat value={artisan.sold_count} label="Sotilgan" />
          </dl>
        </div>
      </Link>
    </article>
  );
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div>
      <dt className="sr-only">{label}</dt>
      <dd>
        <span className="block font-display text-xl font-extrabold">{value}</span>
        <span className="block text-[12px] text-ink-600 dark:text-ink-400">{label}</span>
      </dd>
    </div>
  );
}
