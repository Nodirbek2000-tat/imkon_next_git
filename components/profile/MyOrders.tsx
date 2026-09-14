"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { api, ApiError, type ApiOrder } from "@/lib/api";
import { botPaymentLink, hasBot } from "@/lib/telegram";
import { formatDate, formatPrice } from "@/lib/utils";

type Tone = "gold" | "neutral" | "success" | "brand";

/**
 * Buyurtma holati + chek holati birgalikda bitta yorliqqa aylanadi.
 *
 * Xaridor uchun "to'lov kutilmoqda" va "chekingiz tekshirilmoqda" butunlay
 * boshqa narsa — birinchisida u nimadir qilishi kerak, ikkinchisida kutadi.
 */
function statusLabel(order: ApiOrder): { text: string; tone: Tone } {
  if (order.status === "paid") return { text: "To'lov qilindi", tone: "success" };
  if (order.status === "cancelled") return { text: "Bekor qilindi", tone: "neutral" };

  if (order.payment_status === "pending")
    return { text: "Chek tekshirilmoqda", tone: "brand" };
  if (order.payment_status === "rejected")
    return { text: "Chek rad etildi", tone: "neutral" };

  return { text: "To'lov kutilmoqda", tone: "gold" };
}

export function MyOrders() {
  const [orders, setOrders] = useState<ApiOrder[] | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(() => {
    api
      .myOrders()
      .then((data) => setOrders(data.results))
      .catch(() => setOrders([]));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const cancel = async (order: ApiOrder) => {
    setBusyId(order.id);
    setError("");
    try {
      await api.cancelOrder(order.id);
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Bekor qilinmadi");
    } finally {
      setBusyId(null);
    }
  };

  if (orders === null) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="rounded-[var(--radius-card)] border p-6">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="mt-4 h-16 w-full" />
          </div>
        ))}
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div>
        <h2 className="mb-4 text-xl font-bold">Buyurtmalarim</h2>
        <div className="rounded-[var(--radius-card)] border border-dashed p-12 text-center">
          <p className="text-lg font-bold">Hech narsa yo&apos;q</p>
          <p className="mx-auto mt-2 max-w-sm text-sm text-ink-600 dark:text-ink-400">
            Sizda hali buyurtma mavjud emas. Kerakli narsalarni topish uchun katalogdan
            foydalaning.
          </p>
          <Button href="/katalog" className="mt-6">
            Xaridlarni boshlash
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h2 className="mb-4 text-xl font-bold">Buyurtmalarim</h2>

      {error && (
        <p role="alert" className="mb-4 text-sm font-medium text-brand-600">
          {error}
        </p>
      )}

      <ul className="space-y-4">
        {orders.map((order) => {
          const label = statusLabel(order);
          const needsPayment =
            order.status === "pending" && order.payment_status !== "pending";
          return (
            <li
              key={order.id}
              className="rounded-[var(--radius-card)] border bg-[var(--surface)] p-5"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-semibold">{order.order_number}</p>
                  <time className="text-[12px] text-ink-600 dark:text-ink-400">
                    {formatDate(order.created_at, true)}
                  </time>
                </div>
                <Badge tone={label.tone}>{label.text}</Badge>
              </div>

              {order.payment_status === "rejected" && (
                <p className="mt-3 rounded-xl bg-brand-50 px-3 py-2 text-sm text-brand-700 dark:bg-brand-950 dark:text-brand-300">
                  Chekingiz qabul qilinmadi
                  {order.reject_reason ? `: ${order.reject_reason}` : "."} Qaytadan
                  to&apos;lov qilib ko&apos;ring.
                </p>
              )}

              {order.payment_status === "pending" && (
                <p className="mt-3 rounded-xl bg-ink-100 px-3 py-2 text-sm text-ink-700 dark:bg-ink-800 dark:text-ink-300">
                  Chekingiz tekshirilmoqda — odatda 5–10 daqiqa oladi. Javob
                  Telegram botga keladi.
                </p>
              )}

              <ul className="mt-4 divide-y border-t">
                {order.items.map((item) => (
                  <li key={item.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                    {item.product_slug ? (
                      <Link
                        href={`/mahsulot/${item.product_slug}`}
                        className="min-w-0 flex-1 truncate hover:text-brand-600"
                      >
                        {item.title}
                      </Link>
                    ) : (
                      <span className="min-w-0 flex-1 truncate text-ink-500">{item.title}</span>
                    )}
                    <span className="shrink-0 text-ink-600 dark:text-ink-400">
                      {item.quantity} x {formatPrice(Number(item.price))}
                    </span>
                  </li>
                ))}
              </ul>

              <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t pt-3">
                <span className="font-display text-lg font-extrabold">
                  {formatPrice(Number(order.total))}
                </span>

                <div className="flex items-center gap-4">
                  {order.status === "pending" && (
                    <button
                      type="button"
                      onClick={() => cancel(order)}
                      disabled={busyId === order.id}
                      className="text-sm font-medium text-ink-600 hover:text-brand-600 dark:text-ink-400"
                    >
                      {busyId === order.id ? "Bekor qilinmoqda…" : "Bekor qilish"}
                    </button>
                  )}
                  {needsPayment && hasBot && (
                    <Button
                      href={botPaymentLink(order.order_number)}
                      target="_blank"
                      rel="noopener noreferrer"
                      size="sm"
                    >
                      To&apos;lov qilish
                    </Button>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
