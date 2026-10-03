"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Container } from "@/components/ui/Container";
import { PageHeader, EmptyState, ErrorState } from "@/components/ui/PageHeader";
import { Skeleton } from "@/components/ui/Skeleton";
import { Reveal } from "@/components/ui/Reveal";
import { api, ApiError, type ApiSchool } from "@/lib/api";
import { initialOf } from "@/lib/utils";

export default function SchoolsPage() {
  const [schools, setSchools] = useState<ApiSchool[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params: Record<string, string> = {};
      if (search.trim()) params.search = search.trim();
      const data = await api.schools(params);
      setSchools(data.results);
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
        eyebrow="Maktablar"
        title="Hunar o'rgatayotgan maktablar"
        description="Bu maktablarda bolalar o'z qo'llari bilan ishlashni o'rganadi. Maktabni tanlang — o'quvchilarini va ular yasagan buyumlarni ko'rasiz."
      />

      <Container className="py-12">
        <div className="relative mb-10 max-w-lg">
          <label htmlFor="school-search" className="sr-only">
            Maktab qidirish
          </label>
          <input
            id="school-search"
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Maktab nomi, viloyat yoki tuman…"
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
                <Skeleton className="mt-5 h-10 w-full" />
              </li>
            ))}
          </ul>
        ) : error ? (
          <ErrorState message={error} onRetry={load} />
        ) : schools.length === 0 ? (
          /* Hech kim hech narsa qidirmagan bo'lsa "boshqa so'z bilan
             qidiring" degan maslahat sahifa buzilgandek taassurot
             qoldiradi — ikki holatni ajratamiz */
          search.trim() ? (
            <EmptyState
              title={`“${search.trim()}” bo'yicha maktab topilmadi`}
              hint="Maktab nomini qisqartirib yoki viloyat nomini yozib ko'ring."
            />
          ) : (
            <EmptyState
              title="Hali maktab qo'shilmagan"
              hint="Maktablar qo'shilgandan keyin shu yerda ko'rinadi."
            />
          )
        ) : (
          <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {schools.map((school, i) => (
              <li key={school.id}>
                <Reveal delay={Math.min(i, 5) * 0.07}>
                  <SchoolCard school={school} />
                </Reveal>
              </li>
            ))}
          </ul>
        )}
      </Container>
    </>
  );
}

function SchoolCard({ school }: { school: ApiSchool }) {
  return (
    <article className="group h-full">
      <Link
        href={`/maktablar/${school.slug}`}
        className="flex h-full flex-col overflow-hidden rounded-[var(--radius-card)] border bg-[var(--surface)] shadow-[var(--shadow-soft)] transition-[transform,box-shadow] duration-500 [transition-timing-function:var(--ease-out-soft)] hover:-translate-y-1.5 hover:shadow-[var(--shadow-lift)]"
      >
        <div className="flex flex-1 flex-col p-6">
          <div className="mb-4">
            {school.logo ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={school.logo}
                alt=""
                className="size-16 rounded-2xl bg-[var(--bg)] object-contain"
              />
            ) : (
              <span className="grid size-16 place-items-center rounded-2xl bg-ink-900 font-display text-2xl font-extrabold text-white dark:bg-ink-100 dark:text-ink-950">
                {initialOf(school.name)}
              </span>
            )}
          </div>

          <h2 className="text-xl leading-snug font-bold transition-colors duration-300 group-hover:text-brand-600">
            {school.name}
          </h2>
          {/* Viloyat yoki tuman bo'sh bo'lishi mumkin — osilib qolgan
              "· " ajratgich qolmasin */}
          <p className="mt-1 text-[14px] text-ink-600 dark:text-ink-400">
            {[school.region, school.district].filter(Boolean).join(" · ")}
          </p>

          <p className="mt-auto border-t pt-5 text-[14px] text-ink-600 dark:text-ink-400">
            <span className="font-display text-xl font-extrabold text-ink-900 dark:text-ink-100">
              {school.students_count}
            </span>{" "}
            o&apos;quvchi
          </p>
        </div>
      </Link>
    </article>
  );
}
