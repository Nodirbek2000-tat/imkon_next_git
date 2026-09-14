"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { Input } from "@/components/ui/Input";
import { Skeleton } from "@/components/ui/Skeleton";
import {
  adminApi,
  ApiError,
  type AuctionCandidate,
} from "@/lib/api";
import { cn, formatPrice } from "@/lib/utils";

/** `<input type="datetime-local">` mahalliy vaqtni beradi — ISO'ga o'giramiz. */
function toIso(local: string) {
  return new Date(local).toISOString();
}

/** Hozirgi vaqt `datetime-local` formatida (sekundsiz). */
function nowLocal(offsetHours = 0) {
  const date = new Date(Date.now() + offsetHours * 3_600_000);
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
    `T${pad(date.getHours())}:${pad(date.getMinutes())}`
  );
}

export function AuctionCreateForm({ onCreated }: { onCreated: () => void }) {
  const [candidates, setCandidates] = useState<AuctionCandidate[] | null>(null);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<AuctionCandidate | null>(null);

  const [startPrice, setStartPrice] = useState("");
  const [minIncrement, setMinIncrement] = useState("5000");
  const [startAt, setStartAt] = useState(nowLocal());
  const [endAt, setEndAt] = useState(nowLocal(72));

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState("");

  useEffect(() => {
    adminApi
      .auctionCandidates()
      .then((data) => setCandidates(data.results))
      .catch(() => setCandidates([]));
  }, []);

  // Qidiruv brauzerda — nomzodlar ro'yxati odatda kichik, har harfda
  // serverga so'rov yuborish ortiqcha
  const visible = useMemo(() => {
    if (!candidates) return [];
    const needle = search.trim().toLowerCase();
    if (!needle) return candidates;
    return candidates.filter(
      (item) =>
        item.title_uz.toLowerCase().includes(needle) ||
        item.artisan_name.toLowerCase().includes(needle),
    );
  }, [candidates, search]);

  const pick = (item: AuctionCandidate) => {
    setSelected(item);
    setError("");
    setDone("");
    // Boshlang'ich narx odatda mahsulot narxidan boshlanadi — admin o'zgartira oladi
    if (!startPrice) setStartPrice(String(Math.round(Number(item.price))));
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setDone("");

    if (!selected) {
      setError("Avval mahsulotni tanlang");
      return;
    }
    if (!startPrice || Number(startPrice) <= 0) {
      setError("Boshlang'ich narxni kiriting");
      return;
    }
    if (new Date(endAt) <= new Date(startAt)) {
      setError("Tugash vaqti boshlanishdan keyin bo'lishi kerak");
      return;
    }

    setBusy(true);
    try {
      await adminApi.createAuction({
        product: selected.slug,
        start_price: startPrice,
        min_increment: minIncrement || "5000",
        start_at: toIso(startAt),
        end_at: toIso(endAt),
      });

      setDone(`"${selected.title_uz}" auksionga qo'yildi.`);
      setSelected(null);
      setStartPrice("");
      setCandidates((prev) =>
        prev ? prev.filter((item) => item.id !== selected.id) : prev,
      );
      onCreated();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Auksion ochilmadi");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form
      onSubmit={submit}
      className="rounded-[var(--radius-card)] border bg-[var(--surface)] p-6"
    >
      <h3 className="text-lg font-bold">Yangi auksion</h3>
      <p className="mt-1 text-[13px] text-ink-600 dark:text-ink-400">
        Mahsulotni tanlang, boshlang&apos;ich narx va tugash vaqtini belgilang.
        Ishtirokchilar faqat joriy narxdan yuqori taklif qila oladi.
      </p>

      {/* --- mahsulot tanlash --- */}
      <div className="mt-6">
        <Input
          id="auction-search"
          label="Mahsulot qidirish"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Nomi yoki do'kon nomi"
          disabled={busy}
        />

        {candidates === null ? (
          <div className="mt-3 space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full rounded-2xl" />
            ))}
          </div>
        ) : visible.length === 0 ? (
          <p className="mt-3 rounded-2xl border border-dashed p-6 text-center text-sm text-ink-600 dark:text-ink-400">
            {candidates.length === 0
              ? "Auksionga qo'yish mumkin bo'lgan mahsulot yo'q."
              : "Qidiruv bo'yicha hech narsa topilmadi."}
          </p>
        ) : (
          <ul
            role="radiogroup"
            aria-label="Mahsulot tanlash"
            className="mt-3 max-h-72 space-y-2 overflow-y-auto pr-1"
          >
            {visible.map((item) => {
              const isPicked = selected?.id === item.id;
              return (
                <li key={item.id}>
                  <button
                    type="button"
                    role="radio"
                    aria-checked={isPicked}
                    onClick={() => pick(item)}
                    disabled={busy}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-2xl border-2 p-3 text-left",
                      "transition-colors duration-200 disabled:opacity-50",
                      isPicked
                        ? "border-brand-600 bg-brand-50 dark:bg-brand-950"
                        : "border-[var(--line)] hover:border-ink-400",
                    )}
                  >
                    <span className="relative size-12 shrink-0 overflow-hidden rounded-xl bg-ink-100 dark:bg-ink-800">
                      {item.image && (
                        <Image
                          src={item.image}
                          alt=""
                          fill
                          sizes="48px"
                          className="object-cover"
                        />
                      )}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-semibold">
                        {item.title_uz}
                      </span>
                      <span className="block truncate text-[12px] text-ink-600 dark:text-ink-400">
                        {item.artisan_name} · {formatPrice(Number(item.price))}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* --- shartlar --- */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <Input
          id="auction-start-price"
          label="Boshlang'ich narx (so'm)"
          type="number"
          min={1}
          value={startPrice}
          onChange={(e) => setStartPrice(e.target.value)}
          disabled={busy}
        />
        <Input
          id="auction-min-increment"
          label="Minimal qadam (so'm)"
          type="number"
          min={100}
          value={minIncrement}
          onChange={(e) => setMinIncrement(e.target.value)}
          disabled={busy}
        />
        <Input
          id="auction-start-at"
          label="Boshlanish vaqti"
          type="datetime-local"
          value={startAt}
          onChange={(e) => setStartAt(e.target.value)}
          disabled={busy}
        />
        <Input
          id="auction-end-at"
          label="Tugash vaqti"
          type="datetime-local"
          value={endAt}
          onChange={(e) => setEndAt(e.target.value)}
          disabled={busy}
        />
      </div>

      {error && (
        <p role="alert" className="mt-4 text-sm font-medium text-brand-600">
          {error}
        </p>
      )}
      {done && (
        <p role="status" className="mt-4 text-sm font-medium text-success">
          {done}
        </p>
      )}

      <button
        type="submit"
        disabled={busy || !selected}
        className="mt-6 rounded-full bg-brand-600 px-6 py-3 text-sm font-semibold text-white shadow-[var(--shadow-brand)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-brand-700 disabled:pointer-events-none disabled:opacity-50"
      >
        {busy ? "Ochilmoqda…" : "Auksionni ochish"}
      </button>
    </form>
  );
}
