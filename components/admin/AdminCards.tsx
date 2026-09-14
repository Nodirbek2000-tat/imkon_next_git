"use client";

import { useCallback, useEffect, useState } from "react";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { ErrorState } from "@/components/ui/PageHeader";
import { adminApi, ApiError, type AdminPaymentCard } from "@/lib/api";
import { cn, formatDate } from "@/lib/utils";

/** "8600123456789012" -> "8600 1234 5678 9012" (yozayotganda) */
function groupDigits(raw: string) {
  const digits = raw.replace(/\D/g, "").slice(0, 19);
  return digits.replace(/(.{4})/g, "$1 ").trim();
}

export function AdminCards() {
  const [cards, setCards] = useState<AdminPaymentCard[] | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(async (silent = false) => {
    if (!silent) setCards(null);
    setError("");
    try {
      setCards(await adminApi.cards());
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Yuklab bo'lmadi");
      setCards([]);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (error && cards === null) return <ErrorState message={error} onRetry={() => load()} />;

  const active = cards?.find((c) => c.is_active) ?? null;

  return (
    <div className="space-y-8">
      {/*
        Eng muhim ma'lumot tepada: hozir qaysi kartaga pul tushyapti.
        Faol karta yo'q bo'lsa bu ogohlantirishga aylanadi — to'lovlar
        butunlay to'xtaydi va buni admin darrov bilishi kerak.
      */}
      {cards !== null && <ActiveBanner card={active} />}

      <AddCardForm onAdded={() => load(true)} />

      <div>
        <h3 className="mb-4 text-lg font-bold">Kartalar</h3>

        {cards === null ? (
          <div className="space-y-3">
            {Array.from({ length: 2 }).map((_, i) => (
              <Skeleton key={i} className="h-24 w-full rounded-2xl" />
            ))}
          </div>
        ) : cards.length === 0 ? (
          <p className="rounded-2xl border border-dashed p-10 text-center text-sm text-ink-600 dark:text-ink-400">
            Hali karta qo&apos;shilmagan.
          </p>
        ) : (
          <ul className="space-y-3">
            {cards.map((card) => (
              <li key={card.id}>
                <CardRow card={card} onChange={() => load(true)} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function ActiveBanner({ card }: { card: AdminPaymentCard | null }) {
  if (!card) {
    return (
      <div className="rounded-[var(--radius-card)] border-2 border-brand-600 bg-brand-50 p-6 dark:bg-brand-950">
        <p className="font-bold text-brand-700 dark:text-brand-300">
          ⚠️ Faol karta yo&apos;q — to&apos;lovlar ishlamaydi
        </p>
        <p className="mt-2 text-sm text-brand-700/80 dark:text-brand-300/80">
          Xaridor botda &ldquo;To&apos;lov qilish&rdquo;ni bosganda karta
          ko&apos;rsatilmaydi. Pastdan karta qo&apos;shing yoki mavjudini
          faollashtiring.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-[var(--radius-card)] bg-ink-900 p-6 text-white dark:bg-ink-100 dark:text-ink-950">
      <p className="text-[11px] font-semibold tracking-[0.12em] uppercase opacity-60">
        Pul shu kartaga tushmoqda
      </p>
      <p className="mt-2 font-mono text-2xl font-bold tracking-wider sm:text-3xl">
        {card.number}
      </p>
      <p className="mt-1 font-semibold">
        {card.holder_name}
        {card.bank && <span className="opacity-60"> · {card.bank}</span>}
      </p>
    </div>
  );
}

function AddCardForm({ onAdded }: { onAdded: () => void }) {
  const [number, setNumber] = useState("");
  const [holder, setHolder] = useState("");
  const [bank, setBank] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState("");

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setDone("");

    if (number.replace(/\D/g, "").length < 16) {
      setError("Karta raqamini to'liq kiriting");
      return;
    }
    if (holder.trim().length < 3) {
      setError("Karta egasining ism familiyasini kiriting");
      return;
    }

    setBusy(true);
    try {
      const card = await adminApi.addCard({
        number,
        holder_name: holder.trim(),
        bank: bank.trim(),
      });
      setDone(`${card.number} qo'shildi va faollashtirildi.`);
      setNumber("");
      setHolder("");
      setBank("");
      onAdded();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Karta qo'shilmadi");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form
      onSubmit={submit}
      className="rounded-[var(--radius-card)] border bg-[var(--surface)] p-6"
    >
      <h3 className="text-lg font-bold">Yangi karta</h3>
      <p className="mt-1 text-[13px] text-ink-600 dark:text-ink-400">
        Qo&apos;shilgan karta darrov faol bo&apos;ladi — oldingisi
        avtomatik o&apos;chadi. Bir vaqtda faqat bitta karta ishlaydi.
      </p>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <Input
          id="card-number"
          label="Karta raqami"
          inputMode="numeric"
          placeholder="8600 1234 5678 9012"
          className="font-mono tracking-wider"
          value={number}
          onChange={(e) => setNumber(groupDigits(e.target.value))}
          disabled={busy}
        />
        <Input
          id="card-holder"
          label="Ism familiya"
          hint="Kartada yozilganidek"
          placeholder="MALIKA KAMOLIDDINOVNA"
          value={holder}
          onChange={(e) => setHolder(e.target.value)}
          disabled={busy}
        />
        <Input
          id="card-bank"
          label="Bank"
          hint="Ixtiyoriy"
          placeholder="Kapitalbank"
          value={bank}
          onChange={(e) => setBank(e.target.value)}
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
        disabled={busy}
        className="mt-6 rounded-full bg-brand-600 px-6 py-3 text-sm font-semibold text-white shadow-[var(--shadow-brand)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-brand-700 disabled:pointer-events-none disabled:opacity-50"
      >
        {busy ? "Qo'shilmoqda…" : "Kartani qo'shish"}
      </button>
    </form>
  );
}

function CardRow({ card, onChange }: { card: AdminPaymentCard; onChange: () => void }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const toggle = async () => {
    setBusy(true);
    setError("");
    try {
      if (card.is_active) await adminApi.deactivateCard(card.id);
      else await adminApi.activateCard(card.id);
      onChange();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Amal bajarilmadi");
    } finally {
      setBusy(false);
    }
  };

  return (
    <article
      className={cn(
        "rounded-2xl border-2 bg-[var(--surface)] p-5 transition-colors duration-300",
        card.is_active ? "border-success" : "border-[var(--line)]",
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="font-mono text-lg font-bold tracking-wider">{card.number}</p>
          <p className="mt-1 font-semibold">{card.holder_name}</p>
          <p className="mt-0.5 text-[12px] text-ink-600 dark:text-ink-400">
            {card.bank && `${card.bank} · `}
            {card.payments_count} ta to&apos;lov · {formatDate(card.created_at)}
          </p>
        </div>

        {card.is_active ? (
          <Badge tone="success">Faol</Badge>
        ) : (
          <Badge tone="neutral">O&apos;chirilgan</Badge>
        )}
      </div>

      <div className="mt-4 border-t pt-4">
        <button
          type="button"
          onClick={toggle}
          disabled={busy}
          className={cn(
            "rounded-full px-5 py-2.5 text-[13px] font-semibold transition-all duration-300 disabled:opacity-50",
            card.is_active
              ? "border-2 border-[var(--line)] hover:border-brand-600 hover:text-brand-600"
              : "bg-ink-900 text-white hover:-translate-y-0.5 dark:bg-ink-100 dark:text-ink-950",
          )}
        >
          {busy ? "…" : card.is_active ? "O'chirish" : "Faollashtirish"}
        </button>

        {error && (
          <p role="alert" className="mt-3 text-sm font-medium text-brand-600">
            {error}
          </p>
        )}
      </div>
    </article>
  );
}
