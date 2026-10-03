"use client";

import { useCallback, useEffect, useState } from "react";
import { Container } from "@/components/ui/Container";
import { adminApi, type AdminStats, type ApiUser } from "@/lib/api";
import { AdminStatsGrid } from "@/components/admin/AdminStatsGrid";
import { AdminApplications } from "@/components/admin/AdminApplications";
import { AdminUsers } from "@/components/admin/AdminUsers";
import { AdminAuctions } from "@/components/admin/AdminAuctions";
import {
  AdminSchools,
  SchoolSecretCard,
  type SchoolSecret,
} from "@/components/admin/AdminSchools";
import { AdminCards } from "@/components/admin/AdminCards";
import { cn } from "@/lib/utils";

type Tab =
  | "statistika"
  | "arizalar"
  | "foydalanuvchilar"
  | "auksionlar"
  | "maktablar"
  | "kartalar";

// Kirish huquqi allaqachon serverda (`app/admin/page.tsx`) tekshirilgan —
// bu komponent faqat admin uchun render qilinadi, qayta tekshiruv kerak emas.
export function AdminPageClient({ user }: { user: ApiUser }) {
  const [tab, setTab] = useState<Tab>("statistika");
  const [stats, setStats] = useState<AdminStats | null>(null);
  /**
   * Maktab logini va paroli — backend uni FAQAT bir marta beradi.
   * Holat ataylab shu yerda: ilgari u `AdminSchools` ichida edi va admin boshqa
   * tabga o'tishi bilan komponent unmount bo'lib, hali nusxa olinmagan parol
   * butunlay yo'qolardi. Endi karta tablardan yuqorida, tab almashsa ham
   * joyida turadi.
   */
  const [schoolSecret, setSchoolSecret] = useState<SchoolSecret | null>(null);

  const loadStats = useCallback(async () => {
    try {
      setStats(await adminApi.stats());
    } catch {
      setStats(null);
    }
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  const tabs: { id: Tab; label: string; badge?: number }[] = [
    { id: "statistika", label: "Statistika" },
    { id: "arizalar", label: "Arizalar", badge: stats?.applications_pending },
    { id: "foydalanuvchilar", label: "Foydalanuvchilar" },
    { id: "auksionlar", label: "Auksionlar" },
    { id: "maktablar", label: "Maktablar" },
    { id: "kartalar", label: "To'lov kartalari" },
  ];

  return (
    <>
      {/* Admin sarlavhasi — qizil, oddiy sahifalardan aniq farq qilsin */}
      <section className="grain relative overflow-hidden border-b bg-brand-600 py-12">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-32 -right-24 size-96 rounded-full border-[3px] border-white/10"
        />
        <Container className="relative">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-1.5 text-[11px] font-bold tracking-[0.16em] text-white uppercase backdrop-blur">
            <ShieldIcon />
            Admin panel
          </span>
          <h1 className="mt-4 text-[clamp(2rem,4.5vw,3rem)] leading-tight font-extrabold text-white">
            Boshqaruv markazi
          </h1>
          <p className="mt-2 text-white/80">
            {user.full_name || user.phone} · platforma administratori
          </p>
        </Container>
      </section>

      <Container className="py-10">
        {/* key — yangi parol kelganda karta ichidagi "nusxa olindi" holati tozalanadi */}
        {schoolSecret && (
          <div className="mb-10">
            <SchoolSecretCard
              key={`${schoolSecret.login}-${schoolSecret.password}`}
              secret={schoolSecret}
              onClose={() => setSchoolSecret(null)}
            />
          </div>
        )}

        {/* Tablar */}
        <div
          role="tablist"
          aria-label="Admin bo'limlari"
          className="mb-10 flex flex-wrap gap-2"
        >
          {tabs.map((item) => (
            <button
              key={item.id}
              role="tab"
              aria-selected={tab === item.id}
              onClick={() => setTab(item.id)}
              className={cn(
                "inline-flex items-center gap-2 rounded-full border-2 px-5 py-2.5 text-sm font-semibold",
                "transition-all duration-300 [transition-timing-function:var(--ease-out-soft)]",
                tab === item.id
                  ? "border-brand-600 bg-brand-600 text-white"
                  : "border-[var(--line)] hover:border-brand-600 hover:text-brand-600",
              )}
            >
              {item.label}
              {!!item.badge && item.badge > 0 && (
                <span
                  className={cn(
                    "grid size-5 place-items-center rounded-full text-[11px] font-bold",
                    tab === item.id ? "bg-white text-brand-600" : "bg-brand-600 text-white",
                  )}
                >
                  {item.badge}
                </span>
              )}
            </button>
          ))}
        </div>

        {tab === "statistika" && <AdminStatsGrid stats={stats} />}
        {tab === "arizalar" && <AdminApplications onChange={loadStats} />}
        {tab === "foydalanuvchilar" && <AdminUsers currentUserId={user.id} onChange={loadStats} />}
        {tab === "auksionlar" && <AdminAuctions onChange={loadStats} />}
        {tab === "maktablar" && (
          <AdminSchools onSecret={setSchoolSecret} onChange={loadStats} />
        )}
        {tab === "kartalar" && <AdminCards />}
      </Container>
    </>
  );
}

function ShieldIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 3 5 6v6c0 4.5 3 8 7 9 4-1 7-4.5 7-9V6l-7-3Z"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinejoin="round"
      />
    </svg>
  );
}
