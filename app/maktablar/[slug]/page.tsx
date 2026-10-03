"use client";

import Link from "next/link";
import { use, useEffect, useState } from "react";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { PageLoader } from "@/components/ui/Skeleton";
import { EmptyState, ErrorState } from "@/components/ui/PageHeader";
import { Reveal } from "@/components/ui/Reveal";
import { api, ApiError, type ApiSchoolDetail, type ApiStudent } from "@/lib/api";
import { cn, initialOf } from "@/lib/utils";

export default function SchoolPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);

  const [school, setSchool] = useState<ApiSchoolDetail | null>(null);
  const [error, setError] = useState("");
  // `true` bilan boshlanadi va faqat javob kelgach o'chadi — effekt ichida
  // qayta `true` qilish shart emas, bir maktab sahifasidan boshqasiga
  // o'tadigan havola yo'q
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;

    api
      .school(slug)
      .then((data) => {
        if (alive) setSchool(data);
      })
      .catch((err) => {
        if (alive) setError(err instanceof ApiError ? err.message : "Maktab topilmadi");
      })
      .finally(() => alive && setLoading(false));

    return () => {
      alive = false;
    };
  }, [slug]);

  if (loading) return <PageLoader label="Maktab yuklanmoqda" />;

  if (error || !school) {
    return (
      <Container className="py-20">
        <ErrorState message={error || "Maktab topilmadi"} />
        <div className="mt-6 text-center">
          <Button href="/maktablar" variant="outline">
            Maktablarga qaytish
          </Button>
        </div>
      </Container>
    );
  }

  // Maktabning jami ishlari alohida maydonda kelmaydi — o'quvchilarning
  // ishlarini qo'shib hisoblaymiz
  const worksTotal = school.students.reduce((sum, student) => sum + student.products_count, 0);
  const place = [school.region, school.district].filter(Boolean).join(" · ");

  return (
    <>
      {/* Banner faqat maktab rasm yuklagan bo'lsa — bo'sh gradient chiziq
          sahifa tepasida hech narsa demasdi */}
      {school.banner && (
        <div className="grain relative h-44 w-full overflow-hidden lg:h-56">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={school.banner} alt="" className="size-full object-cover" />
        </div>
      )}

      <Container>
        {/* Sarlavha — banner bo'lsa logo uning ustiga chiqadi, matn esa
            oddiy oqimda qoladi (aks holda rasm ustidagi yozuv o'qilmasdi) */}
        <div className="flex flex-wrap items-end gap-6 pb-8">
          <div className={cn("shrink-0", school.banner ? "-mt-16" : "mt-8")}>
            {school.logo ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={school.logo}
                alt=""
                className="size-28 rounded-3xl border-4 border-[var(--bg)] bg-[var(--surface)] object-contain"
              />
            ) : (
              <span className="grid size-28 place-items-center rounded-3xl border-4 border-[var(--bg)] bg-ink-900 font-display text-4xl font-extrabold text-white dark:bg-ink-100 dark:text-ink-950">
                {initialOf(school.name)}
              </span>
            )}
          </div>

          <div className="min-w-0 flex-1 pt-3">
            <Badge tone="brand">Maktab</Badge>
            <h1 className="mt-2.5 text-[clamp(1.75rem,4vw,2.5rem)] leading-tight font-extrabold break-words">
              {school.name}
            </h1>
            {place && <p className="mt-1 text-ink-600 dark:text-ink-400">{place}</p>}
            {school.contact_phone && (
              <a
                href={`tel:${school.contact_phone.replace(/\s/g, "")}`}
                className="mt-2 inline-flex items-center gap-2 text-[15px] font-semibold transition-colors duration-300 hover:text-brand-600"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path
                    d="M4 5c0-.6.4-1 1-1h2.3c.5 0 .9.3 1 .8l.7 3c.1.4-.1.8-.4 1l-1.4 1a12 12 0 0 0 5.9 5.9l1-1.4c.2-.3.6-.5 1-.4l3 .7c.5.1.8.5.8 1V19c0 .6-.4 1-1 1h-1A13 13 0 0 1 4 6V5Z"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
                {school.contact_phone}
              </a>
            )}
          </div>

          {/* Ataylab `students.length` — pastda chizilayotgan ro'yxatning
              o'zi. `students_count` ga o'tilsa, raqam ro'yxatdagi kartalar
              sonidan farq qilib qolish xavfi paydo bo'ladi. Sahifadagi
              ikkala joyda ham SHU manba ishlatiladi. */}
          <dl className="flex w-full gap-8 sm:w-auto">
            <SchoolStat value={school.students.length} label="O'quvchi" />
            <SchoolStat value={worksTotal} label="Ish" />
          </dl>
        </div>

        {school.about && (
          <section className="mb-10 rounded-[var(--radius-card)] border bg-[var(--surface)] p-6 shadow-[var(--shadow-soft)] sm:p-8">
            <h2 className="font-display text-lg font-bold">Maktab haqida</h2>
            <p className="mt-3 max-w-2xl text-[16px] leading-relaxed whitespace-pre-line text-ink-700 dark:text-ink-300">
              {school.about}
            </p>
          </section>
        )}

        <section className="pb-16">
          <div className="mb-6 flex flex-wrap items-baseline gap-3 border-b pb-4">
            <h2 className="font-display text-2xl font-extrabold">O&apos;quvchilar</h2>
            <span className="text-[15px] text-ink-600 dark:text-ink-400">
              {school.students.length} ta
            </span>
          </div>

          {school.students.length === 0 ? (
            <EmptyState
              title="Hali o'quvchi qo'shilmagan"
              hint="Maktab o'quvchilarini qo'shgach, ularning ishlari shu yerda ko'rinadi."
            />
          ) : (
            <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {school.students.map((student, i) => (
                <li key={student.id}>
                  <Reveal delay={Math.min(i, 7) * 0.06}>
                    <StudentCard student={student} />
                  </Reveal>
                </li>
              ))}
            </ul>
          )}
        </section>
      </Container>
    </>
  );
}

function StudentCard({ student }: { student: ApiStudent }) {
  return (
    <article className="group h-full">
      <Link
        href={`/hunarmandlar/${student.slug}`}
        className="flex h-full flex-col rounded-[var(--radius-card)] border bg-[var(--surface)] p-6 text-center shadow-[var(--shadow-soft)] transition-[transform,box-shadow] duration-500 [transition-timing-function:var(--ease-out-soft)] hover:-translate-y-1.5 hover:shadow-[var(--shadow-lift)]"
      >
        {student.avatar ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img src={student.avatar} alt="" className="mx-auto size-20 rounded-2xl object-cover" />
        ) : (
          <span className="mx-auto grid size-20 place-items-center rounded-2xl bg-ink-900 font-display text-2xl font-extrabold text-white dark:bg-ink-100 dark:text-ink-950">
            {initialOf(student.full_name)}
          </span>
        )}

        <h3 className="mt-4 text-[17px] leading-snug font-bold transition-colors duration-300 group-hover:text-brand-600">
          {student.full_name}
        </h3>
        {student.student_grade && (
          <p className="mt-1 text-[14px] text-ink-600 dark:text-ink-400">{student.student_grade}</p>
        )}

        <p className="mt-auto pt-5 text-[14px] text-ink-600 dark:text-ink-400">
          <span className="font-display text-lg font-extrabold text-ink-900 dark:text-ink-100">
            {student.products_count}
          </span>{" "}
          ta ish
        </p>
      </Link>
    </article>
  );
}

function SchoolStat({ value, label }: { value: number; label: string }) {
  return (
    <div className="text-center">
      <dt className="sr-only">{label}</dt>
      <dd>
        <span className="block font-display text-2xl font-extrabold">{value}</span>
        <span className="block text-[13px] text-ink-600 dark:text-ink-400">{label}</span>
      </dd>
    </div>
  );
}
