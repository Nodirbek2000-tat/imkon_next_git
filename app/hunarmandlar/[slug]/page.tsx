"use client";

import Link from "next/link";
import { use, useEffect, useState } from "react";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { PageLoader } from "@/components/ui/Skeleton";
import { EmptyState, ErrorState } from "@/components/ui/PageHeader";
import { ApiProductCard } from "@/components/ApiProductCard";
import { PostCard } from "@/components/PostCard";
import { Reveal } from "@/components/ui/Reveal";
import {
  api,
  ApiError,
  type ApiArtisanDetail,
  type ApiPost,
  type ApiProduct,
} from "@/lib/api";
import { cn, initialOf } from "@/lib/utils";

type Tab = "ishlar" | "postlar" | "haqida";

export default function ArtisanProfilePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);

  const [artisan, setArtisan] = useState<ApiArtisanDetail | null>(null);
  const [products, setProducts] = useState<ApiProduct[]>([]);
  const [posts, setPosts] = useState<ApiPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<Tab>("ishlar");

  useEffect(() => {
    let alive = true;
    setLoading(true);

    Promise.all([
      api.artisan(slug),
      api.products({ artisan: slug }).catch(() => ({ results: [] as ApiProduct[] })),
      api.posts(slug).catch(() => ({ results: [] as ApiPost[] })),
    ])
      .then(([profile, productPage, postPage]) => {
        if (!alive) return;
        setArtisan(profile);
        setProducts(productPage.results);
        setPosts(postPage.results);
      })
      .catch((err) => {
        if (alive) setError(err instanceof ApiError ? err.message : "Sahifa topilmadi");
      })
      .finally(() => alive && setLoading(false));

    return () => {
      alive = false;
    };
  }, [slug]);

  if (loading) return <PageLoader label="Profil yuklanmoqda" />;

  if (error || !artisan) {
    return (
      <Container className="py-20">
        <ErrorState message={error || "Bu sahifa topilmadi"} />
        {/* Sahifa yuklanmagani uchun bu kim bo'lganini (hunarmand yoki
            o'quvchi) bilmaymiz — shuning uchun matn betaraf, va o'quvchi
            sahifasiga maktabdan kelgan odam uchun ikkinchi yo'l ham bor */}
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Button href="/hunarmandlar" variant="outline">
            Hunarmandlar
          </Button>
          <Button href="/maktablar" variant="outline">
            Maktablar
          </Button>
        </div>
      </Container>
    );
  }

  // Sahifa matnlari o'quvchi va hunarmand uchun boshqacha — "Hunarmand tez
  // orada ish jarayonini ulashadi" degan gap 7-sinf bolasi haqida g'alati
  const isStudent = artisan.kind === "student";

  const tabs: { id: Tab; label: string; count?: number }[] = [
    { id: "ishlar", label: "Ishlar", count: products.length },
    { id: "postlar", label: "Postlar", count: posts.length },
    { id: "haqida", label: "Haqida" },
  ];

  return (
    <>
      {/* Banner faqat hunarmand o'z rasmini yuklagan bo'lsa. Rasmsiz
          gradient chiziq hech qanday ma'lumot bermas, sahifa tepasida
          shunchaki bo'sh joy egallardi. */}
      {artisan.banner && (
        <div
          className="grain relative h-44 w-full lg:h-56"
          style={{ background: `url(${artisan.banner}) center/cover` }}
          aria-hidden="true"
        />
      )}

      <Container>
        {/* Profil sarlavhasi — banner bo'lsa avatar uning ustiga chiqadi,
            matn esa oddiy oqimda qoladi (aks holda sarlavha banner rasmiga
            singib, o'qib bo'lmay qolardi) */}
        <div className="flex flex-wrap items-end gap-6 pb-8">
          <div className={cn("shrink-0", artisan.banner ? "-mt-16" : "mt-8")}>
            {artisan.user.avatar ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={artisan.user.avatar}
                alt=""
                className="size-28 rounded-3xl border-4 border-[var(--bg)] object-cover"
              />
            ) : (
              <span className="grid size-28 place-items-center rounded-3xl border-4 border-[var(--bg)] bg-ink-900 font-display text-4xl font-extrabold text-white dark:bg-ink-100 dark:text-ink-950">
                {artisan.shop_name.charAt(0)}
              </span>
            )}
          </div>

          <div className="min-w-0 flex-1 pt-3">
            {/* Maktab o'quvchisi ekani sarlavhadan oldin ko'rinadi — xaridor
                bu ishni 7-sinf bolasi qilganini bilib tursin */}
            {isStudent && <Badge tone="success">O&apos;quvchi</Badge>}
            <h1
              className={cn(
                "text-[clamp(1.75rem,4vw,2.5rem)] leading-tight font-extrabold",
                isStudent && "mt-2.5",
              )}
            >
              {artisan.shop_name}
            </h1>
            <p className="mt-1 text-ink-600 dark:text-ink-400">
              {artisan.user.full_name}
              {artisan.region && ` · ${artisan.region}`}
            </p>

            {/* Maktab faqat o'quvchida bo'ladi — oddiy hunarmandda null.
                Bola kimning qo'li ostida ishlayotgani ko'rinib turishi va
                bir bosishda maktab sahifasiga o'tish mumkin bo'lishi kerak. */}
            {artisan.school && (
              <Link
                href={`/maktablar/${artisan.school.slug}`}
                className="group/school mt-3 inline-flex max-w-full items-center gap-3 rounded-full border bg-[var(--surface)] py-2 pr-4 pl-2 shadow-[var(--shadow-soft)] transition-[border-color,box-shadow] duration-300 [transition-timing-function:var(--ease-out-soft)] hover:border-brand-600 hover:shadow-[var(--shadow-lift)]"
              >
                {artisan.school.logo ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={artisan.school.logo}
                    alt=""
                    className="size-9 shrink-0 rounded-full bg-[var(--bg)] object-contain"
                  />
                ) : (
                  <span className="grid size-9 shrink-0 place-items-center rounded-full bg-ink-900 font-display text-sm font-extrabold text-white dark:bg-ink-100 dark:text-ink-950">
                    {initialOf(artisan.school.name)}
                  </span>
                )}
                <span className="min-w-0">
                  <span className="block text-[11px] font-semibold tracking-[0.12em] text-ink-500 uppercase dark:text-ink-400">
                    Maktab
                  </span>
                  <span className="block text-[15px] font-bold transition-colors duration-300 group-hover/school:text-brand-600">
                    {artisan.school.name}
                    {artisan.student_grade && (
                      <span className="font-medium text-ink-600 dark:text-ink-400">
                        {" · "}
                        {artisan.student_grade}
                      </span>
                    )}
                  </span>
                  {/* Telefonda `hover` YO'Q — bosiladigan narsa ekani
                      harakatsiz ham ko'rinib turishi kerak, aks holda
                      bola -> maktab yo'li shu joyda uzilib qoladi */}
                  <span className="block text-[12px] font-semibold text-brand-600">
                    Maktab sahifasini ko&apos;rish
                  </span>
                </span>

                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  aria-hidden="true"
                  className="ml-1 shrink-0 text-brand-600 transition-transform duration-300 [transition-timing-function:var(--ease-out-soft)] group-hover/school:translate-x-1"
                >
                  <path
                    d="m9 6 6 6-6 6"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </Link>
            )}
          </div>

          <dl className="flex w-full gap-8 sm:w-auto">
            <ProfileStat value={artisan.products_count} label="Ish" />
            <ProfileStat value={artisan.posts_count} label="Post" />
            <ProfileStat value={artisan.sold_count} label="Sotilgan" />
          </dl>
        </div>

        {artisan.crafts.length > 0 && (
          <div className="flex flex-wrap gap-2 pb-8">
            {artisan.crafts.map((craft) => (
              <Badge key={craft.id} tone="brand">
                {craft.icon} {craft.name}
              </Badge>
            ))}
          </div>
        )}

        {/* Tablar */}
        <div role="tablist" aria-label="Profil bo'limlari" className="flex gap-1 border-b">
          {tabs.map((item) => (
            <button
              key={item.id}
              role="tab"
              aria-selected={tab === item.id}
              onClick={() => setTab(item.id)}
              className={cn(
                "relative px-5 py-3.5 text-[15px] font-semibold transition-colors duration-300",
                tab === item.id ? "text-brand-600" : "text-ink-600 hover:text-brand-600 dark:text-ink-400",
              )}
            >
              {item.label}
              {item.count !== undefined && (
                <span className="ml-1.5 text-[13px] opacity-70">{item.count}</span>
              )}
              <span
                className={cn(
                  "absolute inset-x-3 -bottom-px h-0.5 rounded-full bg-brand-600 transition-transform duration-400 [transition-timing-function:var(--ease-out-soft)]",
                  tab === item.id ? "scale-x-100" : "scale-x-0",
                )}
              />
            </button>
          ))}
        </div>

        {/* Tab tarkibi */}
        <div className="py-10">
          {tab === "ishlar" &&
            (products.length === 0 ? (
              <EmptyState
                title="Hali ish qo'shilmagan"
                hint={
                  isStudent
                    ? "O'quvchining ishlari maktab tomonidan qo'shiladi."
                    : undefined
                }
              />
            ) : (
              <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {products.map((product, i) => (
                  <li key={product.id}>
                    <Reveal delay={Math.min(i, 7) * 0.06}>
                      <ApiProductCard product={product} />
                    </Reveal>
                  </li>
                ))}
              </ul>
            ))}

          {tab === "postlar" &&
            (posts.length === 0 ? (
              <EmptyState
                title="Hali post yo'q"
                hint={
                  isStudent
                    ? "Maktab o'quvchining ish jarayonini keyinroq ulashadi."
                    : "Hunarmand tez orada ish jarayonini ulashadi."
                }
              />
            ) : (
              <ul className="mx-auto grid max-w-2xl gap-8">
                {posts.map((post, i) => (
                  <li key={post.id}>
                    <Reveal delay={Math.min(i, 4) * 0.08}>
                      <PostCard post={post} />
                    </Reveal>
                  </li>
                ))}
              </ul>
            ))}

          {tab === "haqida" && (
            <div className="max-w-2xl">
              {artisan.about ? (
                <p className="text-[17px] leading-relaxed whitespace-pre-line text-ink-700 dark:text-ink-300">
                  {artisan.about}
                </p>
              ) : (
                <EmptyState title="Ma'lumot kiritilmagan" />
              )}
            </div>
          )}
        </div>
      </Container>
    </>
  );
}

function ProfileStat({ value, label }: { value: number; label: string }) {
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
