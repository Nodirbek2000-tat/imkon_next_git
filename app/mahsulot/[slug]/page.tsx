"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { use, useEffect, useState } from "react";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { PageLoader } from "@/components/ui/Skeleton";
import { ErrorState } from "@/components/ui/PageHeader";
import { Comments, StaticStars } from "@/components/Comments";
import { useAuth } from "@/components/auth/AuthProvider";
import { useCart } from "@/components/cart/CartProvider";
import { api, ApiError, type ApiProductDetail } from "@/lib/api";
import { formatPrice, cn } from "@/lib/utils";

export default function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const router = useRouter();
  const { user } = useAuth();
  const { addItem } = useCart();

  const [product, setProduct] = useState<ApiProductDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [active, setActive] = useState(0);
  const [cartBusy, setCartBusy] = useState(false);
  const [cartMessage, setCartMessage] = useState("");

  useEffect(() => {
    let alive = true;
    setLoading(true);

    api
      .product(slug)
      .then((data) => alive && setProduct(data))
      .catch((err) =>
        alive && setError(err instanceof ApiError ? err.message : "Mahsulot topilmadi"),
      )
      .finally(() => alive && setLoading(false));

    return () => {
      alive = false;
    };
  }, [slug]);

  const handleAddToCart = async () => {
    if (!user) {
      router.push(`/kirish?next=${encodeURIComponent(`/mahsulot/${slug}`)}`);
      return;
    }
    setCartBusy(true);
    setCartMessage("");
    try {
      await addItem(slug);
      setCartMessage("Savatga qo'shildi");
    } catch (err) {
      setCartMessage(err instanceof ApiError ? err.message : "Savatga qo'shilmadi");
    } finally {
      setCartBusy(false);
    }
  };

  if (loading) return <PageLoader label="Mahsulot yuklanmoqda" />;

  if (error || !product) {
    return (
      <Container className="py-20">
        <ErrorState message={error || "Mahsulot topilmadi"} />
        <div className="mt-6 text-center">
          <Button href="/katalog" variant="outline">
            Katalogga qaytish
          </Button>
        </div>
      </Container>
    );
  }

  const images = product.images ?? [];

  return (
    <Container className="py-12 lg:py-16">
      {/* Nonushta yo'li */}
      <nav aria-label="Yo'l" className="mb-8 flex flex-wrap items-center gap-2 text-sm">
        <Link href="/katalog" className="text-ink-600 hover:text-brand-600 dark:text-ink-400">
          Katalog
        </Link>
        <span className="text-ink-400">/</span>
        <Link
          href={`/katalog?category=${product.category?.slug}`}
          className="text-ink-600 hover:text-brand-600 dark:text-ink-400"
        >
          {product.category?.name}
        </Link>
        <span className="text-ink-400">/</span>
        <span className="font-medium">{product.title}</span>
      </nav>

      <div className="grid gap-10 lg:grid-cols-2 lg:gap-14">
        {/* Galereya */}
        <div>
          <div className="overflow-hidden rounded-[var(--radius-card)] border bg-[var(--surface)]">
            {images.length > 0 ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={images[active].image}
                alt={images[active].alt_text || product.title}
                className="aspect-square w-full object-cover"
              />
            ) : (
              <div
                className="grain relative aspect-square w-full"
                style={{ background: "linear-gradient(135deg, #dc1b38, #831528)" }}
                aria-hidden="true"
              />
            )}
          </div>

          {images.length > 1 && (
            <ul className="mt-4 flex gap-3 overflow-x-auto pb-2">
              {images.map((image, i) => (
                <li key={image.id}>
                  <button
                    type="button"
                    onClick={() => setActive(i)}
                    aria-label={`${i + 1}-rasm`}
                    aria-current={i === active}
                    className={cn(
                      "size-20 shrink-0 overflow-hidden rounded-xl border-2 transition-colors duration-300",
                      i === active ? "border-brand-600" : "border-[var(--line)] hover:border-brand-400",
                    )}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={image.image} alt="" className="size-full object-cover" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Ma'lumot */}
        <div>
          <div className="flex flex-wrap gap-2">
            <Badge tone="brand">{product.category?.name}</Badge>
            {product.has_auction && <Badge tone="gold">Auksion loti</Badge>}
            {product.status === "sold" && <Badge tone="neutral">Sotilgan</Badge>}
          </div>

          <h1 className="mt-5 text-[clamp(1.9rem,4vw,2.75rem)] leading-[1.05] font-extrabold">
            {product.title}
          </h1>

          {product.rating_count > 0 && product.rating_avg !== null && (
            <a
              href="#izohlar"
              className="mt-2 inline-flex items-center gap-2 text-sm hover:text-brand-600"
            >
              <StaticStars value={Math.round(product.rating_avg)} />
              <span className="font-semibold">{product.rating_avg.toFixed(1)}</span>
              <span className="text-ink-600 dark:text-ink-400">
                ({product.rating_count} sharh)
              </span>
            </a>
          )}

          <Link
            href={`/hunarmandlar/${product.artisan.slug}`}
            className="group mt-5 inline-flex items-center gap-3 rounded-2xl border p-3 pr-5 transition-colors duration-300 hover:border-brand-600"
          >
            <span className="grid size-11 place-items-center rounded-xl bg-brand-600 font-display text-lg font-bold text-white">
              {product.artisan.shop_name.charAt(0)}
            </span>
            <span>
              <span className="block text-[13px] text-ink-600 dark:text-ink-400">Hunarmand</span>
              <span className="block font-bold transition-colors group-hover:text-brand-600">
                {product.artisan.shop_name}
              </span>
            </span>
          </Link>

          <div className="mt-8 rounded-[var(--radius-card)] border bg-[var(--surface)] p-6">
            <p className="text-[11px] font-semibold tracking-[0.12em] text-ink-600 uppercase dark:text-ink-400">
              {product.has_auction ? "Boshlang'ich narx" : "Narx"}
            </p>
            <p className="mt-1 font-display text-4xl font-extrabold text-brand-600">
              {formatPrice(Number(product.price))}
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              {product.has_auction && product.auction_id ? (
                <Button href={`/auksion/${product.auction_id}`} size="lg">
                  Auksionga o'tish
                </Button>
              ) : (
                <Button
                  type="button"
                  size="lg"
                  disabled={product.stock === 0 || cartBusy}
                  onClick={handleAddToCart}
                >
                  {product.stock === 0
                    ? "Tugagan"
                    : cartBusy
                      ? "Qo'shilmoqda…"
                      : "Savatga qo'shish"}
                </Button>
              )}
              <Button href="/katalog" size="lg" variant="outline">
                Boshqa ishlar
              </Button>
            </div>

            {cartMessage && (
              <p role="status" className="mt-4 text-sm font-medium text-brand-600">
                {cartMessage}
              </p>
            )}

            {!product.has_auction && product.stock > 0 && (
              <p className="mt-4 text-[13px] text-ink-600 dark:text-ink-400">
                Zaxirada: {product.stock} dona
              </p>
            )}
          </div>

          {product.description && (
            <div className="mt-8">
              <h2 className="text-xl font-bold">Tavsif</h2>
              <p className="mt-3 leading-relaxed whitespace-pre-line text-ink-700 dark:text-ink-300">
                {product.description}
              </p>
            </div>
          )}

          {product.features?.length > 0 && (
            <div className="mt-8">
              <h2 className="text-xl font-bold">Xususiyatlari</h2>
              <dl className="mt-3 divide-y overflow-hidden rounded-2xl border">
                {product.features.map((feature) => (
                  <div key={feature.name} className="flex gap-4 p-3.5">
                    <dt className="w-2/5 shrink-0 text-ink-600 dark:text-ink-400">
                      {feature.name}
                    </dt>
                    <dd className="font-medium">{feature.value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )}

          <p className="mt-8 text-[13px] text-ink-600 dark:text-ink-400">
            {product.views_count} marta ko&apos;rilgan
          </p>
        </div>
      </div>

      <Comments slug={slug} />
    </Container>
  );
}
