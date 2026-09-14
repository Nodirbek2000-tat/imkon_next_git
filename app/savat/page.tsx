"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";
import { PageLoader } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/PageHeader";
import { useAuth } from "@/components/auth/AuthProvider";
import { useCart } from "@/components/cart/CartProvider";
import { api, ApiError, type ApiCartItem } from "@/lib/api";
import { botPaymentLink, hasBot } from "@/lib/telegram";
import { formatPrice } from "@/lib/utils";

export default function CartPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { items, loading: cartLoading, updateItem, removeItem, refresh } = useCart();
  const [checkingOut, setCheckingOut] = useState(false);
  const [order, setOrder] = useState<{ orderNumber: string } | null>(null);

  useEffect(() => {
    if (!authLoading && !user) router.replace("/kirish?next=/savat");
  }, [authLoading, user, router]);

  if (authLoading || cartLoading || !user) return <PageLoader label="Savat yuklanmoqda" />;

  if (order) {
    return (
      <Container className="py-16">
        <div className="mx-auto max-w-lg rounded-[var(--radius-card)] border bg-[var(--surface)] p-10 text-center">
          <span className="mx-auto grid size-14 place-items-center rounded-full bg-brand-600 text-2xl text-white">
            ✓
          </span>
          <h1 className="mt-5 text-2xl font-extrabold">Buyurtma qabul qilindi</h1>
          <p className="mt-2 text-ink-600 dark:text-ink-400">
            Buyurtma raqami: <span className="font-semibold">{order.orderNumber}</span>
          </p>

          {hasBot ? (
            <>
              <div className="mt-6 rounded-2xl bg-ink-100 p-5 text-left dark:bg-ink-800">
                <p className="text-sm font-bold">To&apos;lov Telegram bot orqali:</p>
                <ol className="mt-3 space-y-2 text-sm text-ink-700 dark:text-ink-300">
                  <li>1. Botga o&apos;ting — buyurtmangiz avtomatik ochiladi</li>
                  <li>2. Ko&apos;rsatilgan kartaga summani o&apos;tkazing</li>
                  <li>3. Chek rasmini botga yuboring</li>
                  <li>4. 5–10 daqiqada tasdiqlanadi</li>
                </ol>
              </div>

              <div className="mt-6 flex flex-wrap justify-center gap-3">
                <Button
                  href={botPaymentLink(order.orderNumber)}
                  target="_blank"
                  rel="noopener noreferrer"
                  size="lg"
                >
                  Botda to&apos;lov qilish
                </Button>
                <Button href="/profil" variant="outline" size="lg">
                  Buyurtmalarim
                </Button>
              </div>
            </>
          ) : (
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Button href="/profil">Buyurtmalarimga o&apos;tish</Button>
              <Button href="/katalog" variant="outline">
                Xaridni davom ettirish
              </Button>
            </div>
          )}
        </div>
      </Container>
    );
  }

  if (items.length === 0) {
    return (
      <Container className="py-16">
        <h1 className="mb-8 text-2xl font-extrabold">Savat</h1>
        <EmptyState
          icon="🛒"
          title="Savat bo'sh"
          hint="Kerakli narsalarni topish uchun katalogdan foydalaning."
        />
        <div className="mt-6 text-center">
          <Button href="/katalog">Xaridlarni boshlash</Button>
        </div>
      </Container>
    );
  }

  const total = items.reduce((sum, item) => sum + Number(item.subtotal), 0);

  return (
    <Container className="py-12 lg:py-16">
      <h1 className="mb-8 text-2xl font-extrabold">Savat, {items.length} ta mahsulot</h1>

      <div className="lg:grid lg:grid-cols-[1fr_320px] lg:items-start lg:gap-8">
        <ul className="space-y-4">
          {items.map((item) => (
            <CartRow
              key={item.id}
              item={item}
              onUpdate={(quantity) => updateItem(item.id, quantity)}
              onRemove={() => removeItem(item.id)}
            />
          ))}
        </ul>

        <div className="sticky top-24 mt-8 lg:mt-0">
          {checkingOut ? (
            <CheckoutForm
              onSuccess={async (orderNumber) => {
                setOrder({ orderNumber });
                await refresh();
              }}
              onCancel={() => setCheckingOut(false)}
            />
          ) : (
            <div className="rounded-[var(--radius-card)] border bg-[var(--surface)] p-6">
              <h2 className="text-lg font-bold">Buyurtmangiz</h2>
              <div className="mt-4 flex items-center justify-between border-t pt-4">
                <span className="text-ink-600 dark:text-ink-400">Jami</span>
                <span className="font-display text-xl font-extrabold">{formatPrice(total)}</span>
              </div>
              <Button size="lg" className="mt-5 w-full" onClick={() => setCheckingOut(true)}>
                Rasmiylashtirishga o&apos;tish
              </Button>
            </div>
          )}
        </div>
      </div>
    </Container>
  );
}

function CartRow({
  item,
  onUpdate,
  onRemove,
}: {
  item: ApiCartItem;
  onUpdate: (quantity: number) => Promise<void>;
  onRemove: () => Promise<void>;
}) {
  const [busy, setBusy] = useState(false);
  const product = item.product;

  const change = async (delta: number) => {
    const next = item.quantity + delta;
    if (next < 1) return;
    setBusy(true);
    try {
      await onUpdate(next);
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    setBusy(true);
    try {
      await onRemove();
    } finally {
      setBusy(false);
    }
  };

  return (
    <li className="flex gap-4 rounded-[var(--radius-card)] border bg-[var(--surface)] p-4">
      <Link
        href={`/mahsulot/${product.slug}`}
        className="relative size-20 shrink-0 overflow-hidden rounded-xl bg-ink-100 dark:bg-ink-800"
      >
        {product.main_image ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={product.main_image.url}
            alt={product.main_image.alt || product.title}
            className="size-full object-cover"
          />
        ) : (
          <div className="grain size-full bg-gradient-to-br from-brand-500 to-gold-500" />
        )}
      </Link>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-start justify-between gap-3">
          <Link
            href={`/mahsulot/${product.slug}`}
            className="font-semibold hover:text-brand-600"
          >
            {product.title}
          </Link>
          <button
            type="button"
            onClick={remove}
            disabled={busy}
            aria-label="Savatdan o'chirish"
            className="shrink-0 text-ink-500 transition-colors hover:text-brand-600"
          >
            ✕
          </button>
        </div>
        <p className="text-sm text-ink-600 dark:text-ink-400">{product.artisan.shop_name}</p>

        <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-3">
          <div className="flex items-center gap-3 rounded-full border-2 border-[var(--line)] px-1 py-1">
            <button
              type="button"
              onClick={() => change(-1)}
              disabled={busy || item.quantity <= 1}
              aria-label="Kamaytirish"
              className="grid size-7 place-items-center rounded-full text-lg font-bold transition-colors hover:bg-ink-900/[0.06] disabled:opacity-40 dark:hover:bg-ink-100/10"
            >
              −
            </button>
            <span className="w-5 text-center text-sm font-semibold tabular-nums">
              {item.quantity}
            </span>
            <button
              type="button"
              onClick={() => change(1)}
              disabled={busy}
              aria-label="Ko'paytirish"
              className="grid size-7 place-items-center rounded-full text-lg font-bold transition-colors hover:bg-ink-900/[0.06] dark:hover:bg-ink-100/10"
            >
              +
            </button>
          </div>
          <span className="font-display text-lg font-extrabold">
            {formatPrice(Number(item.subtotal))}
          </span>
        </div>
      </div>
    </li>
  );
}

function CheckoutForm({
  onSuccess,
  onCancel,
}: {
  onSuccess: (orderNumber: string) => void;
  onCancel: () => void;
}) {
  const { user } = useAuth();
  const [fullName, setFullName] = useState(user?.full_name ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [address, setAddress] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");

    if (!fullName.trim() || !phone.trim() || !address.trim()) {
      setError("Barcha maydonlarni to'ldiring");
      return;
    }

    setBusy(true);
    try {
      const created = await api.checkout({
        full_name: fullName.trim(),
        phone: phone.trim(),
        address: address.trim(),
      });
      onSuccess(created.order_number);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Buyurtma yuborilmadi");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form
      onSubmit={submit}
      className="space-y-4 rounded-[var(--radius-card)] border bg-[var(--surface)] p-6"
    >
      <h2 className="text-lg font-bold">Yetkazib berish ma&apos;lumotlari</h2>

      <Input
        id="checkout-name"
        label="To'liq ism"
        value={fullName}
        onChange={(e) => setFullName(e.target.value)}
        disabled={busy}
      />
      <Input
        id="checkout-phone"
        label="Telefon raqami"
        type="tel"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        disabled={busy}
      />
      <Textarea
        id="checkout-address"
        label="Manzil"
        rows={3}
        value={address}
        onChange={(e) => setAddress(e.target.value)}
        placeholder="Viloyat, tuman, ko'cha, uy"
        disabled={busy}
      />

      {error && (
        <p role="alert" className="text-sm font-medium text-brand-600">
          {error}
        </p>
      )}

      <p className="text-[12px] text-ink-600 dark:text-ink-400">
        Buyurtma berilgach to&apos;lov Telegram bot orqali amalga oshiriladi: kartaga
        o&apos;tkazasiz va chek rasmini yuborasiz.
      </p>

      <div className="flex gap-3">
        <Button size="lg" disabled={busy} className="flex-1">
          {busy ? "Yuborilmoqda…" : "Buyurtma berish"}
        </Button>
        <Button type="button" size="lg" variant="outline" onClick={onCancel} disabled={busy}>
          Orqaga
        </Button>
      </div>
    </form>
  );
}
