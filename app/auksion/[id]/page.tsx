"use client";

import Link from "next/link";
import { use, useCallback, useEffect, useState } from "react";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { Badge, LiveDot } from "@/components/ui/Badge";
import { PageLoader } from "@/components/ui/Skeleton";
import { ErrorState, EmptyState } from "@/components/ui/PageHeader";
import { Countdown } from "@/components/Countdown";
import { LeadingBid } from "@/components/auction/LeadingBid";
import { useAuth } from "@/components/auth/AuthProvider";
import { api, ApiError, type ApiAuctionDetail } from "@/lib/api";
import { cn, formatPrice } from "@/lib/utils";

export default function AuctionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { user } = useAuth();

  const [auction, setAuction] = useState<ApiAuctionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [amount, setAmount] = useState("");
  const [bidding, setBidding] = useState(false);
  const [bidError, setBidError] = useState("");
  const [success, setSuccess] = useState("");
  const [activeImage, setActiveImage] = useState(0);

  const load = useCallback(async () => {
    try {
      const data = await api.auction(id);
      setAuction(data);
      setError("");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Auksion topilmadi");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  // Boshqalarning takliflarini ko'rish uchun har 10 soniyada yangilaymiz.
  // (WebSocket 6-bosqichda — hozircha polling yetarli.)
  useEffect(() => {
    if (!auction?.is_live) return;
    const id = setInterval(load, 10_000);
    return () => clearInterval(id);
  }, [auction?.is_live, load]);

  const placeBid = async (useIncrement: boolean) => {
    if (!auction) return;
    setBidError("");
    setSuccess("");
    setBidding(true);

    try {
      const body = useIncrement ? { increment: true } : { amount };
      const result = await api.placeBid(auction.id, body);
      setSuccess(`Taklifingiz qabul qilindi: ${formatPrice(Number(result.current_price))}`);
      setAmount("");
      await load();
    } catch (err) {
      setBidError(err instanceof ApiError ? err.message : "Taklif yuborilmadi");
    } finally {
      setBidding(false);
    }
  };

  if (loading) return <PageLoader label="Auksion yuklanmoqda" />;

  if (error || !auction) {
    return (
      <Container className="py-20">
        <ErrorState message={error || "Auksion topilmadi"} onRetry={load} />
        <div className="mt-6 text-center">
          <Button href="/auksion" variant="outline">
            Auksionlarga qaytish
          </Button>
        </div>
      </Container>
    );
  }

  const images = auction.product.images ?? [];
  const nextMin = Number(auction.next_min_bid);
  const isOwnLot = user?.artisan_slug === auction.product.artisan.slug;

  return (
    <Container className="py-12 lg:py-16">
      <nav aria-label="Yo'l" className="mb-8 flex items-center gap-2 text-sm">
        <Link href="/auksion" className="text-ink-600 hover:text-brand-600 dark:text-ink-400">
          Auksion
        </Link>
        <span className="text-ink-400">/</span>
        <span className="font-medium">{auction.product.title}</span>
      </nav>

      <div className="grid gap-10 lg:grid-cols-2 lg:gap-14">
        {/* Galereya — xaridor nimaga pul tikayotganini to'liq ko'rsin */}
        <div>
          <div className="overflow-hidden rounded-[var(--radius-card)] border bg-[var(--surface)]">
            {images.length > 0 ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={images[activeImage].image}
                alt={images[activeImage].alt_text || auction.product.title}
                className="aspect-square w-full object-cover"
              />
            ) : (
              <div
                className="grain relative aspect-square w-full"
                style={{ background: "linear-gradient(135deg, #a06d14, #f1cd7e)" }}
                aria-hidden="true"
              />
            )}
          </div>

          {images.length > 1 && (
            <ul className="mt-4 flex gap-3 overflow-x-auto pb-2">
              {images.map((img, i) => (
                <li key={img.id}>
                  <button
                    type="button"
                    onClick={() => setActiveImage(i)}
                    aria-label={`${i + 1}-rasm`}
                    aria-current={i === activeImage}
                    className={cn(
                      "size-20 shrink-0 overflow-hidden rounded-xl border-2 transition-colors duration-300",
                      i === activeImage
                        ? "border-brand-600"
                        : "border-[var(--line)] hover:border-brand-400",
                    )}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={img.image} alt="" className="size-full object-cover" />
                  </button>
                </li>
              ))}
            </ul>
          )}

          {auction.product.description && (
            <div className="mt-8">
              <h2 className="text-xl font-bold">Tavsif</h2>
              <p className="mt-3 leading-relaxed whitespace-pre-line text-ink-700 dark:text-ink-300">
                {auction.product.description}
              </p>
            </div>
          )}

          {auction.product.features?.length > 0 && (
            <div className="mt-8">
              <h2 className="text-xl font-bold">Xususiyatlari</h2>
              <dl className="mt-3 divide-y overflow-hidden rounded-2xl border">
                {auction.product.features.map((feature) => (
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
        </div>

        {/* Taklif paneli */}
        <div>
          <div className="flex flex-wrap gap-2">
            {auction.is_live ? (
              <Badge tone="live">
                <LiveDot />
                Jonli auksion
              </Badge>
            ) : (
              <Badge tone="neutral">
                {auction.status === "ended" ? "Tugagan" : "Boshlanmagan"}
              </Badge>
            )}
            <Badge tone="gold">{auction.bids_count} taklif</Badge>
          </div>

          <h1 className="mt-5 text-[clamp(1.75rem,4vw,2.5rem)] leading-[1.05] font-extrabold">
            {auction.product.title}
          </h1>

          <Link
            href={`/hunarmandlar/${auction.product.artisan.slug}`}
            className="mt-3 inline-block text-ink-600 transition-colors hover:text-brand-600 dark:text-ink-400"
          >
            {auction.product.artisan.shop_name}
          </Link>

          {/* Taymer */}
          <div className="mt-7 rounded-[var(--radius-card)] border bg-[var(--surface)] p-6">
            <p className="text-[11px] font-semibold tracking-[0.12em] text-ink-600 uppercase dark:text-ink-400">
              {auction.is_live ? "Tugashiga qoldi" : "Auksion yakunlangan"}
            </p>
            <Countdown
              endAt={auction.end_at}
              onEnd={load}
              className="mt-2 block font-mono text-4xl font-bold"
            />

            <div className="mt-6 grid grid-cols-2 gap-4 border-t pt-5">
              <div>
                <p className="text-[11px] font-semibold tracking-[0.12em] text-ink-600 uppercase dark:text-ink-400">
                  Joriy narx
                </p>
                <p className="mt-1 font-display text-3xl font-extrabold text-brand-600">
                  {formatPrice(Number(auction.current_price))}
                </p>
              </div>
              <div>
                <p className="text-[11px] font-semibold tracking-[0.12em] text-ink-600 uppercase dark:text-ink-400">
                  Minimal taklif
                </p>
                <p className="mt-1 font-display text-3xl font-extrabold">
                  {formatPrice(nextMin)}
                </p>
              </div>
            </div>
          </div>

          {/* Kim yetakchi — narx raqamidan alohida, ko'zga tashlansin */}
          <LeadingBid
            bid={auction.bids[0]}
            isLive={auction.is_live}
            isMine={
              auction.my_max_bid !== null &&
              Number(auction.my_max_bid) === Number(auction.current_price)
            }
          />

          {/* Taklif qilish */}
          {auction.is_live && (
            <div className="mt-6">
              {!user ? (
                <div className="rounded-[var(--radius-card)] border-2 border-dashed p-6 text-center">
                  <p className="font-semibold">Taklif qilish uchun kiring</p>
                  <p className="mt-1 text-sm text-ink-600 dark:text-ink-400">
                    Login, Telegram yoki Google orqali — bir daqiqada.
                  </p>
                  <Button href={`/kirish?next=${encodeURIComponent(`/auksion/${id}`)}`} className="mt-4">
                    Kirish
                  </Button>
                </div>
              ) : isOwnLot ? (
                <p className="rounded-2xl border p-5 text-center text-ink-600 dark:text-ink-400">
                  Bu sizning lotingiz — o'zingizga taklif qila olmaysiz.
                </p>
              ) : (
                <div className="rounded-[var(--radius-card)] border bg-[var(--surface)] p-6">
                  <Button
                    size="lg"
                    className="w-full"
                    disabled={bidding}
                    onClick={() => placeBid(true)}
                  >
                    {bidding ? "Yuborilmoqda…" : `${formatPrice(nextMin)} taklif qilish`}
                  </Button>

                  <div className="my-5 flex items-center gap-3">
                    <span className="h-px flex-1 bg-[var(--line)]" />
                    <span className="text-[13px] text-ink-600 dark:text-ink-400">
                      yoki o'z narxingiz
                    </span>
                    <span className="h-px flex-1 bg-[var(--line)]" />
                  </div>

                  <div className="flex gap-3">
                    <div className="flex-1">
                      <label htmlFor="bid-amount" className="sr-only">
                        Taklif summasi
                      </label>
                      <input
                        id="bid-amount"
                        type="number"
                        inputMode="numeric"
                        min={nextMin}
                        step={1000}
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder={String(nextMin)}
                        className="h-13 w-full rounded-2xl border-2 border-[var(--line)] bg-[var(--bg)] px-4 text-[16px] transition-colors duration-300 outline-none focus:border-brand-600"
                      />
                    </div>
                    <Button
                      variant="dark"
                      size="lg"
                      disabled={bidding || !amount || Number(amount) < nextMin}
                      onClick={() => placeBid(false)}
                    >
                      Yuborish
                    </Button>
                  </div>

                  {bidError && (
                    <p role="alert" className="mt-4 text-sm font-medium text-brand-600">
                      {bidError}
                    </p>
                  )}
                  {success && (
                    <p role="status" className="mt-4 text-sm font-medium text-success">
                      {success}
                    </p>
                  )}

                  {auction.my_max_bid && (
                    <p className="mt-4 text-[13px] text-ink-600 dark:text-ink-400">
                      Sizning eng yuqori taklifingiz:{" "}
                      <strong>{formatPrice(Number(auction.my_max_bid))}</strong>
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Taklif tarixi */}
      <section className="mt-16">
        <h2 className="text-2xl font-extrabold">Takliflar tarixi</h2>

        {auction.bids.length === 0 ? (
          <div className="mt-6">
            <EmptyState title="Hali taklif yo'q" hint="Birinchi bo'ling!" />
          </div>
        ) : (
          <ul className="mt-6 max-w-2xl divide-y rounded-[var(--radius-card)] border bg-[var(--surface)]">
            {auction.bids.map((bid, i) => (
              <li key={bid.id} className="flex items-center justify-between gap-4 p-4">
                <div className="flex items-center gap-3">
                  <span className="grid size-9 place-items-center rounded-full bg-ink-100 text-sm font-bold dark:bg-ink-800">
                    {i + 1}
                  </span>
                  <div>
                    <p className="font-semibold">{bid.user_name}</p>
                    <p className="text-[12px] text-ink-600 dark:text-ink-400">
                      {new Date(bid.created_at).toLocaleString("uz-UZ", {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
                <span
                  className={`font-display text-lg font-extrabold ${i === 0 ? "text-brand-600" : ""}`}
                >
                  {formatPrice(Number(bid.amount))}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </Container>
  );
}
