"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/Skeleton";
import { api, type ApiNotification } from "@/lib/api";
import { cn, formatDate } from "@/lib/utils";

const POLL_MS = 30_000;

const TYPE_ICON: Record<ApiNotification["type"], string> = {
  application_approved: "✓",
  application_rejected: "!",
  new_comment: "💬",
  order_placed: "📦",
  new_order: "🛒",
};

/** Profildagi bildirishnomalar — HAMMA tizimga kirgan foydalanuvchi uchun. */
export function Notifications() {
  const [items, setItems] = useState<ApiNotification[] | null>(null);
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await api.notifications();
      setItems(data.results);
      setUnread(data.unread_count);
    } catch {
      setItems([]);
    }
  }, []);

  useEffect(() => {
    load();
    const id = setInterval(load, POLL_MS);
    return () => clearInterval(id);
  }, [load]);

  const markAll = async () => {
    try {
      await api.markAllNotificationsRead();
      await load();
    } catch {
      /* keyingi poll'da yangilanadi */
    }
  };

  const markOne = async (notification: ApiNotification) => {
    if (notification.is_read) return;
    try {
      await api.markNotificationRead(notification.id);
      setItems(
        (list) =>
          list?.map((n) => (n.id === notification.id ? { ...n, is_read: true } : n)) ?? null,
      );
      setUnread((u) => Math.max(0, u - 1));
    } catch {
      /* keyingi poll'da yangilanadi */
    }
  };

  if (items === null) {
    return (
      <div className="rounded-[var(--radius-card)] border bg-[var(--surface)] p-6">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="mt-4 h-4 w-full" />
      </div>
    );
  }

  const visible = open ? items : items.slice(0, 3);

  return (
    <div className="rounded-[var(--radius-card)] border bg-[var(--surface)] p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-lg font-bold">
          Bildirishnomalar
          {unread > 0 && (
            <span className="grid size-6 place-items-center rounded-full bg-brand-600 text-[12px] font-bold text-white">
              {unread}
            </span>
          )}
        </h2>
        {unread > 0 && (
          <button
            type="button"
            onClick={markAll}
            className="text-sm font-medium text-brand-600 hover:underline"
          >
            Barchasini o&apos;qilgan qilish
          </button>
        )}
      </div>

      {items.length === 0 ? (
        <p className="mt-3 text-sm text-ink-600 dark:text-ink-400">
          Hozircha bildirishnoma yo&apos;q.
        </p>
      ) : (
        <>
          <ul className="mt-4 space-y-2">
            {visible.map((notification) => (
              <li key={notification.id}>
                <Link
                  href={notification.link_url || "#"}
                  onClick={() => markOne(notification)}
                  className={cn(
                    "flex gap-3 rounded-2xl border p-4 transition-colors duration-300",
                    notification.is_read
                      ? "border-[var(--line)] opacity-70"
                      : "border-brand-600/40 bg-brand-50 dark:bg-brand-950/40",
                  )}
                >
                  <span
                    aria-hidden="true"
                    className={cn(
                      "grid size-9 shrink-0 place-items-center rounded-full text-sm font-bold",
                      notification.is_read
                        ? "bg-ink-100 text-ink-600 dark:bg-ink-800 dark:text-ink-300"
                        : "bg-brand-600 text-white",
                    )}
                  >
                    {TYPE_ICON[notification.type] ?? "•"}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-semibold">{notification.title}</span>
                    {notification.body && (
                      <span className="mt-0.5 block truncate text-sm text-ink-600 dark:text-ink-400">
                        {notification.body}
                      </span>
                    )}
                    <time className="mt-1 block text-[12px] text-ink-600 dark:text-ink-400">
                      {formatDate(notification.created_at, true)}
                    </time>
                  </span>
                </Link>
              </li>
            ))}
          </ul>

          {items.length > 3 && (
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              className="mt-3 text-sm font-medium text-brand-600 hover:underline"
            >
              {open ? "Kamroq ko'rsatish" : `Yana ${items.length - 3} ta ko'rsatish`}
            </button>
          )}
        </>
      )}
    </div>
  );
}
