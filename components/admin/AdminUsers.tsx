"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState, ErrorState } from "@/components/ui/PageHeader";
import { adminApi, ApiError, type AdminUser } from "@/lib/api";
import { cn, formatDate, initialOf } from "@/lib/utils";

type Role = AdminUser["role"];

/**
 * `role` — tanlangan rol. Server `?role=` ni qo'llasa ham, bu yerda yana
 * bir marta tekshiramiz (pastdagi izohga qara).
 */
const FILTERS: { params: Record<string, string>; label: string; role?: Role }[] = [
  { params: {}, label: "Hammasi" },
  { params: { role: "user" }, label: "Xaridorlar", role: "user" },
  { params: { role: "artisan" }, label: "Hunarmandlar", role: "artisan" },
  { params: { role: "school" }, label: "Maktablar", role: "school" },
  { params: { role: "student" }, label: "O'quvchilar", role: "student" },
  { params: { admins: "1" }, label: "Adminlar" },
];

/**
 * Rol belgisi. Har rolga alohida ohang — "Bloklangan" (neutral) bilan
 * ham adashmasin, aks holda ro'yxatda maktab oddiy xaridordan
 * farqlanmaydi.
 */
const ROLE_BADGE: Partial<Record<Role, { label: string; tone: "gold" | "live" | "success" }>> = {
  artisan: { label: "Hunarmand", tone: "gold" },
  school: { label: "Maktab", tone: "live" },
  student: { label: "O'quvchi", tone: "success" },
};

export function AdminUsers({
  currentUserId,
  onChange,
}: {
  currentUserId: number;
  onChange: () => void;
}) {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filterIndex, setFilterIndex] = useState(0);
  const [search, setSearch] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params: Record<string, string> = { ...FILTERS[filterIndex].params };
      if (search.trim()) params.search = search.trim();
      const data = await adminApi.users(params);

      // Backend `?role=` ni barcha maqomlar uchun qo'llaydi (maktab va
      // o'quvchi ham), shuning uchun natijani bu yerda qayta filtrlash
      // shart emas — `count` ham to'g'ridan-to'g'ri serverdan olinadi.
      setUsers(data.results);
      setCount(data.count);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Yuklab bo'lmadi");
    } finally {
      setLoading(false);
    }
  }, [filterIndex, search]);

  useEffect(() => {
    const timer = setTimeout(load, search ? 350 : 0);
    return () => clearTimeout(timer);
  }, [load, search]);

  const patchUser = (updated: AdminUser) => {
    setUsers((list) => list.map((u) => (u.id === updated.id ? updated : u)));
    onChange();
  };

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <div className="relative min-w-56 flex-1">
          <label htmlFor="user-search" className="sr-only">
            Foydalanuvchi qidirish
          </label>
          <input
            id="user-search"
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Ism yoki telefon…"
            className="h-11 w-full rounded-full border-2 border-[var(--line)] bg-[var(--surface)] px-5 text-[15px] transition-colors outline-none focus:border-brand-600"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          {FILTERS.map((item, i) => (
            <button
              key={item.label}
              type="button"
              onClick={() => setFilterIndex(i)}
              aria-pressed={filterIndex === i}
              className={cn(
                "rounded-full border-2 px-4 py-2 text-[13px] font-semibold transition-all duration-300",
                filterIndex === i
                  ? "border-brand-600 bg-brand-600 text-white"
                  : "border-[var(--line)] hover:border-brand-600",
              )}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-2xl" />
          ))}
        </div>
      ) : error ? (
        <ErrorState message={error} onRetry={load} />
      ) : users.length === 0 ? (
        /* Qidiruv natijasi bo'sh bo'lishi va "bu rolda hali hech kim yo'q"
           butunlay boshqa narsa — bitta matn ikkisiga ham yaramaydi */
        search.trim() ? (
          <EmptyState title="Hech narsa topilmadi" hint="Boshqa ism yoki raqam bilan qidiring." />
        ) : filterIndex === 0 ? (
          <EmptyState title="Hali foydalanuvchi yo'q" />
        ) : (
          <EmptyState title={`${FILTERS[filterIndex].label} hali yo'q`} />
        )
      ) : (
        <>
          <p className="mb-4 text-sm text-ink-600 dark:text-ink-400">{count} ta</p>
          <ul className="divide-y overflow-hidden rounded-[var(--radius-card)] border bg-[var(--surface)]">
            {users.map((user) => (
              <li key={user.id}>
                <UserRow
                  user={user}
                  isSelf={user.id === currentUserId}
                  onUpdated={patchUser}
                />
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

function UserRow({
  user,
  isSelf,
  onUpdated,
}: {
  user: AdminUser;
  isSelf: boolean;
  onUpdated: (u: AdminUser) => void;
}) {
  const [busy, setBusy] = useState<"admin" | "active" | null>(null);
  const [error, setError] = useState("");

  const roleBadge = ROLE_BADGE[user.role];

  const run = async (action: "admin" | "active") => {
    // Maktabni bloklash = maktab tizimga kira olmay qoladi va buni
    // hech kim darrov sezmaydi. Shuning uchun bir marta so'raymiz.
    if (action === "active" && user.is_active && user.role === "school") {
      const ok = window.confirm(
        `“${user.full_name || "Maktab"}” bloklansa, maktab tizimga kira olmaydi va o'quvchilari saytda ko'rinmay qoladi. Davom etasizmi?`,
      );
      if (!ok) return;
    }

    setBusy(action);
    setError("");
    try {
      const result =
        action === "admin"
          ? await adminApi.toggleAdmin(user.id)
          : await adminApi.toggleActive(user.id);
      onUpdated(result.user);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Amal bajarilmadi");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-4 p-4 transition-colors duration-300",
        !user.is_active && "bg-ink-100/60 dark:bg-ink-900/60",
      )}
    >
      {user.avatar ? (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img src={user.avatar} alt="" className="size-11 rounded-xl object-cover" />
      ) : (
        <span className="grid size-11 place-items-center rounded-xl bg-ink-200 font-bold dark:bg-ink-800">
          {initialOf(user.full_name, user.phone)}
        </span>
      )}

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-semibold">{user.full_name || "Ismsiz"}</p>
          {user.is_admin && <Badge tone="brand">Admin</Badge>}
          {roleBadge && <Badge tone={roleBadge.tone}>{roleBadge.label}</Badge>}
          {!user.is_active && <Badge tone="neutral">Bloklangan</Badge>}
          {isSelf && <span className="text-[12px] text-ink-600 dark:text-ink-400">(siz)</span>}
        </div>

        {/* Maktab va o'quvchi akkauntida telefon YO'Q — `null` bo'lsa
            boshida osilib qolgan "· " ajratgich qolmasin */}
        <p className="mt-0.5 text-[13px] text-ink-600 dark:text-ink-400">
          {[user.phone, formatDate(user.created_at)].filter(Boolean).join(" · ")}
          {user.artisan_slug && (
            <>
              {" · "}
              <Link
                href={`/hunarmandlar/${user.artisan_slug}`}
                className="text-brand-600 hover:underline"
              >
                {user.role === "student" ? "sahifasi" : "do'kon"}
              </Link>
            </>
          )}
        </p>

        {error && (
          <p role="alert" className="mt-1 text-[13px] font-medium text-brand-600">
            {error}
          </p>
        )}
      </div>

      {!isSelf && (
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => run("admin")}
            disabled={busy !== null}
            className={cn(
              "rounded-full border-2 px-4 py-2 text-[13px] font-semibold transition-all duration-300 disabled:opacity-50",
              user.is_admin
                ? "border-brand-600 bg-brand-600 text-white hover:bg-brand-700"
                : "border-[var(--line)] hover:border-brand-600 hover:text-brand-600",
            )}
          >
            {busy === "admin" ? "…" : user.is_admin ? "Adminlikni olish" : "Admin qilish"}
          </button>

          <button
            type="button"
            onClick={() => run("active")}
            disabled={busy !== null}
            className="rounded-full border-2 border-[var(--line)] px-4 py-2 text-[13px] font-semibold transition-all duration-300 hover:border-brand-600 hover:text-brand-600 disabled:opacity-50"
          >
            {busy === "active" ? "…" : user.is_active ? "Bloklash" : "Ochish"}
          </button>
        </div>
      )}
    </div>
  );
}
