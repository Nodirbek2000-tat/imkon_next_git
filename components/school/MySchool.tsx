"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";
import { Skeleton } from "@/components/ui/Skeleton";
import { ErrorState } from "@/components/ui/PageHeader";
import { useAuth } from "@/components/auth/AuthProvider";
import { api, ApiError, type ApiMySchool } from "@/lib/api";
import { initialOf } from "@/lib/utils";

/**
 * Tanlangan rasm va uning ko'rinishi.
 *
 * Blob manzili rasm tanlangan zahoti yaratiladi, effekt esa faqat uni
 * bo'shatadi: fayl almashsa yoki forma yopilsa `revokeObjectURL` ishlaydi
 * va xotira oqmaydi.
 */
function usePickedImage() {
  const [picked, setPicked] = useState<{ file: File; url: string } | null>(null);

  useEffect(() => {
    if (!picked) return;
    return () => URL.revokeObjectURL(picked.url);
  }, [picked]);

  const pick = (file: File | null) =>
    setPicked(file ? { file, url: URL.createObjectURL(file) } : null);

  return [picked, pick] as const;
}

/** Maktabning o'z ommaviy sahifasi — nomi, haqida, manzil va rasmlar. */
export function MySchool() {
  const [school, setSchool] = useState<ApiMySchool | null>(null);
  const [loadError, setLoadError] = useState("");

  const load = useCallback(async () => {
    setLoadError("");
    try {
      setSchool(await api.mySchool());
    } catch (err) {
      setLoadError(err instanceof ApiError ? err.message : "Ma'lumotni yuklab bo'lmadi");
    }
  }, []);

  useEffect(() => {
    // setState to'g'ridan-to'g'ri effekt tanasida chaqirilmasin (lint qoidasi)
    const timer = setTimeout(() => load(), 0);
    return () => clearTimeout(timer);
  }, [load]);

  if (loadError) return <ErrorState message={loadError} onRetry={load} />;

  if (!school) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-40 w-full rounded-[var(--radius-card)]" />
        <Skeleton className="h-72 w-full rounded-[var(--radius-card)]" />
      </div>
    );
  }

  // Forma maydonlari yuklangan qiymatlardan boshlanadi — shuning uchun u
  // ma'lumot kelganidan KEYIN mount qilinadi.
  return <SchoolForm school={school} onSaved={setSchool} />;
}

function SchoolForm({
  school,
  onSaved,
}: {
  school: ApiMySchool;
  onSaved: (saved: ApiMySchool) => void;
}) {
  const { refreshUser } = useAuth();

  const [nameUz, setNameUz] = useState(school.name_uz);
  const [nameRu, setNameRu] = useState(school.name_ru);
  const [nameEn, setNameEn] = useState(school.name_en);
  const [aboutUz, setAboutUz] = useState(school.about_uz);
  const [aboutRu, setAboutRu] = useState(school.about_ru);
  const [aboutEn, setAboutEn] = useState(school.about_en);
  const [region, setRegion] = useState(school.region);
  const [district, setDistrict] = useState(school.district);
  const [phone, setPhone] = useState(school.contact_phone);

  const [logo, pickLogo] = usePickedImage();
  const [banner, pickBanner] = usePickedImage();

  const [showTranslations, setShowTranslations] = useState(false);
  const [busy, setBusy] = useState(false);
  // Nom xatosi aynan maydon ostida chiqadi: formada maydon ko'p, xato
  // pastda qolsa telefonda o'qituvchi uni topa olmaydi.
  const [nameError, setNameError] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setNameError("");
    setMessage("");

    if (nameUz.trim().length < 3) {
      setNameError("Maktab nomini to'liq yozing (kamida 3 harf)");
      return;
    }

    setBusy(true);
    try {
      const form = new FormData();
      form.append("name_uz", nameUz.trim());
      form.append("about_uz", aboutUz);
      form.append("region", region.trim());
      form.append("district", district.trim());
      form.append("contact_phone", phone.trim());

      // Bo'sh tarjima YUBORILMAYDI: PATCH'da bo'sh qiymat backend'dagi
      // mavjud tarjimani o'chirib yuborardi.
      if (nameRu.trim()) form.append("name_ru", nameRu.trim());
      if (nameEn.trim()) form.append("name_en", nameEn.trim());
      if (aboutRu.trim()) form.append("about_ru", aboutRu);
      if (aboutEn.trim()) form.append("about_en", aboutEn);

      // Rasm tanlanmasa yuborilmaydi — hozirgi rasm o'z joyida qoladi
      if (logo) form.append("logo", logo.file);
      if (banner) form.append("banner", banner.file);

      const saved = await api.updateMySchool(form);
      onSaved(saved);
      setMessage("Saqlandi");
      // Sahifa sarlavhasi va yuqoridagi nom `useAuth().user`dan olinadi.
      // Yangilamasak, nom o'zgargandan keyin ham eski nom turib qoladi va
      // o'qituvchi "saqlanmadi" deb o'ylaydi.
      await refreshUser();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Saqlanmadi");
    } finally {
      setBusy(false);
    }
  };

  // Parol formasi alohida `<form>` — shuning uchun u asosiy formaning
  // ICHIDA bo'lmaydi (bir-birining ichidagi forma ishlamaydi).
  return (
    <div className="space-y-6">
      <SchoolAccountCard school={school} />

      <form onSubmit={save} className="space-y-6">
        {/* asosiy ma'lumot */}
        <section className="space-y-5 rounded-[var(--radius-card)] border bg-[var(--surface)] p-6">
          <h3 className="text-lg font-bold">Maktab haqida</h3>

          <Input
            id="school-name"
            label="Maktab nomi"
            value={nameUz}
            onChange={(e) => {
              setNameUz(e.target.value);
              setNameError("");
            }}
            placeholder="Masalan: 12-son ixtisoslashtirilgan maktab"
            error={nameError}
            disabled={busy}
          />

          <Textarea
            id="school-about"
            label="Maktab haqida"
            value={aboutUz}
            onChange={(e) => setAboutUz(e.target.value)}
            placeholder="Maktabingiz, o'quvchilaringiz va ularning ishlari haqida qisqacha yozing…"
            disabled={busy}
          />

          <div className="grid gap-5 sm:grid-cols-2">
            <Input
              id="school-region"
              label="Viloyat"
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              placeholder="Toshkent"
              disabled={busy}
            />
            <Input
              id="school-district"
              label="Tuman yoki shahar"
              value={district}
              onChange={(e) => setDistrict(e.target.value)}
              placeholder="Yunusobod"
              disabled={busy}
            />
            <Input
              id="school-phone"
              label="Aloqa raqami"
              type="tel"
              hint="Xaridorlar bog'lanishi uchun"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+998 90 123 45 67"
              disabled={busy}
            />
          </div>

          <div>
            <button
              type="button"
              onClick={() => setShowTranslations((v) => !v)}
              className="text-sm font-medium text-brand-600 hover:underline"
            >
              {showTranslations ? "− Tarjimalarni yashirish" : "+ Rus/ingliz tarjimasi"}
            </button>

            {showTranslations && (
              <div className="mt-5 space-y-5 rounded-2xl bg-[var(--bg)] p-5">
                <p className="text-[13px] text-ink-600 dark:text-ink-400">
                  Majburiy emas. Bo&apos;sh qoldirsangiz, sahifa o&apos;zbekcha
                  matnni ko&apos;rsatadi.
                </p>
                <Input
                  id="school-name-ru"
                  label="Maktab nomi (ruscha)"
                  value={nameRu}
                  onChange={(e) => setNameRu(e.target.value)}
                  disabled={busy}
                />
                <Input
                  id="school-name-en"
                  label="Maktab nomi (inglizcha)"
                  value={nameEn}
                  onChange={(e) => setNameEn(e.target.value)}
                  disabled={busy}
                />
                <Textarea
                  id="school-about-ru"
                  label="Maktab haqida (ruscha)"
                  value={aboutRu}
                  onChange={(e) => setAboutRu(e.target.value)}
                  disabled={busy}
                />
                <Textarea
                  id="school-about-en"
                  label="Maktab haqida (inglizcha)"
                  value={aboutEn}
                  onChange={(e) => setAboutEn(e.target.value)}
                  disabled={busy}
                />
              </div>
            )}
          </div>
        </section>

        {/* rasmlar */}
        <section className="space-y-6 rounded-[var(--radius-card)] border bg-[var(--surface)] p-6">
          <div>
            <h3 className="text-lg font-bold">Rasmlar</h3>
            <p className="mt-1 text-[13px] text-ink-600 dark:text-ink-400">
              Ikkisi ham ixtiyoriy. Yangi rasm tanlamasangiz, hozirgisi
              o&apos;z joyida qoladi.
            </p>
          </div>

          {/* logo */}
          <div className="flex items-center gap-4">
            <div className="size-20 shrink-0 overflow-hidden rounded-2xl bg-ink-100 dark:bg-ink-800">
              {logo || school.logo ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={logo?.url ?? school.logo ?? ""}
                  alt=""
                  className="size-full object-cover"
                />
              ) : (
                <span className="grid size-full place-items-center font-display text-2xl font-extrabold text-ink-400">
                  {initialOf(nameUz)}
                </span>
              )}
            </div>

            <div>
              <span className="block text-sm font-semibold">Logo</span>
              <label
                htmlFor="school-logo"
                className="mt-2 inline-block cursor-pointer rounded-full border-2 border-[var(--line)] px-5 py-2.5 text-sm font-semibold transition-colors duration-300 hover:border-brand-600 hover:text-brand-600"
              >
                Rasm tanlash
              </label>
              <input
                id="school-logo"
                type="file"
                accept="image/*"
                className="sr-only"
                disabled={busy}
                onChange={(e) => pickLogo(e.target.files?.[0] ?? null)}
              />
            </div>
          </div>

          {/* banner */}
          <div>
            <span className="block text-sm font-semibold">Sahifa tepasidagi keng rasm</span>
            <div className="mt-2 aspect-3/1 w-full overflow-hidden rounded-2xl border bg-ink-100 dark:bg-ink-800">
              {banner || school.banner ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={banner?.url ?? school.banner ?? ""}
                  alt=""
                  className="size-full object-cover"
                />
              ) : (
                <span className="grid size-full place-items-center text-[13px] text-ink-500 dark:text-ink-400">
                  Rasm tanlanmagan
                </span>
              )}
            </div>
            <label
              htmlFor="school-banner"
              className="mt-3 inline-block cursor-pointer rounded-full border-2 border-[var(--line)] px-5 py-2.5 text-sm font-semibold transition-colors duration-300 hover:border-brand-600 hover:text-brand-600"
            >
              Rasm tanlash
            </label>
            <input
              id="school-banner"
              type="file"
              accept="image/*"
              className="sr-only"
              disabled={busy}
              onChange={(e) => pickBanner(e.target.files?.[0] ?? null)}
            />
          </div>
        </section>

        <div className="flex flex-wrap items-center gap-4">
          <Button type="submit" disabled={busy}>
            {busy ? "Saqlanmoqda…" : "Saqlash"}
          </Button>
          {message && (
            <span role="status" className="text-sm font-medium text-success">
              {message}
            </span>
          )}
          {error && (
            <span role="alert" className="text-sm font-medium text-brand-600">
              {error}
            </span>
          )}
        </div>
      </form>
    </div>
  );
}

/* ------------------------------------------------------------- login va parol */

/**
 * Maktab akkaunti: login (faqat ko'rsatiladi) va parolni o'zgartirish.
 *
 * Parol maktabga bir marta — admin yaratganda — ko'rsatiladi. Uni
 * o'zgartira olmasa, o'qituvchi tizim bergan tasodifiy parolni abadiy
 * qog'ozda olib yurishi kerak bo'ladi; qog'oz yo'qolsa maktab tizimga
 * kira olmaydi. Shuning uchun parol formasi shu yerda.
 */
function SchoolAccountCard({ school }: { school: ApiMySchool }) {
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [confirmError, setConfirmError] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const savePassword = async (event: React.FormEvent) => {
    event.preventDefault();
    setPasswordError("");
    setConfirmError("");
    setError("");
    setDone(false);

    if (password.length < 6) {
      setPasswordError("Parol kamida 6 belgidan iborat bo'lsin");
      return;
    }
    if (password !== confirm) {
      setConfirmError("Parollar mos kelmadi. Ikkala joyga bir xil yozing");
      return;
    }

    setBusy(true);
    try {
      await api.setPassword(password);
      setPassword("");
      setConfirm("");
      setOpen(false);
      setDone(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Parol o'zgartirilmadi");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="rounded-[var(--radius-card)] border bg-[var(--surface)] p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-bold">Maktab sahifasi</h2>
        <Link
          href={`/maktablar/${school.slug}`}
          className="text-sm font-medium text-brand-600 hover:underline"
        >
          Maktab sahifamni ko&apos;rish →
        </Link>
      </div>
      <p className="mt-1 text-[13px] text-ink-600 dark:text-ink-400">
        Bu yerda yozganlaringiz maktabingizning ommaviy sahifasida
        ko&apos;rinadi. {school.students_count} ta o&apos;quvchi.
      </p>

      <div className="mt-5">
        <span className="mb-2 block text-sm font-semibold">Login</span>
        {/* Uzun login ramkadan chiqib ketmasin: `break-all` bo'lmasa 375px
            ekranda sahifada gorizontal skroll paydo bo'ladi. Shuning uchun
            balandlik ham qat'iy emas — matn necha qatorga bo'linsa, quti
            shunga moslashadi. */}
        <div className="flex min-h-13 items-center rounded-2xl border-2 border-[var(--line)] bg-ink-50 px-4 py-3 dark:bg-ink-900">
          <span className="font-mono text-[16px] break-all">{school.login}</span>
        </div>
        <p className="mt-2 text-[13px] text-ink-600 dark:text-ink-400">
          Tizimga shu login bilan kirasiz. Loginni faqat administrator
          o&apos;zgartiradi.
        </p>
      </div>

      <div className="mt-5 border-t border-[var(--line)] pt-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <span className="block text-sm font-semibold">Parol</span>
            <p className="mt-1 text-[13px] text-ink-600 dark:text-ink-400">
              Tizim bergan parolni o&apos;zingiz eslab qoladigan parolga
              almashtirsangiz bo&apos;ladi.
            </p>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={() => {
              setOpen((v) => !v);
              // Forma qayta ochilganda eski "o'zgartirildi" xabari
              // qolib ketmasin — maktab hali yozmagan parolni allaqachon
              // saqlangan deb o'ylardi
              setDone(false);
            }}>
            {open ? "Yopish" : "Parolni o'zgartirish"}
          </Button>
        </div>

        {open && (
          <form onSubmit={savePassword} className="mt-4 space-y-4 rounded-2xl bg-[var(--bg)] p-5">
            <Input
              id="school-new-password"
              label="Yangi parol"
              type="password"
              autoComplete="new-password"
              hint="Kamida 6 belgi"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setPasswordError("");
              }}
              error={passwordError}
              disabled={busy}
            />
            <Input
              id="school-new-password-confirm"
              label="Yangi parolni qayta yozing"
              type="password"
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => {
                setConfirm(e.target.value);
                setConfirmError("");
              }}
              error={confirmError}
              disabled={busy}
            />

            {error && (
              <p role="alert" className="text-sm font-medium text-brand-600">
                {error}
              </p>
            )}

            <Button type="submit" size="sm" disabled={busy}>
              {busy ? "Saqlanmoqda…" : "Parolni saqlash"}
            </Button>
          </form>
        )}

        {done && (
          <div role="status" className="mt-4 rounded-2xl bg-success/10 p-4">
            <p className="text-sm font-semibold text-success">Parol o&apos;zgartirildi.</p>
            <p className="mt-1 text-[13px] text-ink-700 dark:text-ink-300">
              Endi tizimga <span className="font-semibold">{school.login}</span> logini
              va yangi parol bilan kirasiz. Eski parol endi ishlamaydi — yangi
              parolni esda saqlang.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
