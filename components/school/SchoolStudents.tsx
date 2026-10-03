"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/PageHeader";
import { api, ApiError, type ApiStudent } from "@/lib/api";
import { cn, initialOf } from "@/lib/utils";

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

/**
 * Maktab paneli — o'quvchilar.
 *
 * O'quvchi `ArtisanProfile`da saqlanadi, shuning uchun qo'shilgan zahoti
 * uning ishlari katalogga tushadi. Adminning tasdig'i yo'q — interfeys
 * ham shuni ochiq aytib turadi, maktab kutib o'tirmasin.
 */
export function SchoolStudents() {
  const [students, setStudents] = useState<ApiStudent[] | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(async (silent = false) => {
    if (!silent) setStudents(null);
    setError("");
    try {
      // Sahifalanmagan — to'g'ridan-to'g'ri massiv keladi
      setStudents(await api.mySchoolStudents());
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Ro'yxatni yuklab bo'lmadi");
      // Jim yangilanish yiqilsa eski ro'yxat JOYIDA QOLADI va panel xato
      // ekraniga almashmaydi. Sababi: o'quvchi serverda allaqachon
      // yaratilgan bo'lishi mumkin. Ro'yxatni tozalab butun panelni
      // almashtirsak, "Ali qo'shildi" xabari ham yo'qoladi va o'qituvchi
      // aynan o'sha bolani ikkinchi marta kiritadi — bazada ikki nusxa.
      if (!silent) setStudents([]);
    }
  }, []);

  useEffect(() => {
    // setState to'g'ridan-to'g'ri effekt tanasida chaqirilmasin (lint qoidasi)
    const timer = setTimeout(() => load(), 0);
    return () => clearTimeout(timer);
  }, [load]);

  // Tahrirlash va yashirish javobda yangilangan o'quvchini qaytaradi —
  // ro'yxatni qayta so'ramaymiz, qator joyida almashadi va sakramaydi.
  //
  // Solishtiruv `id` bo'yicha: ism o'zgarsa backend `slug`ni qayta
  // hisoblashi mumkin, shunda `slug` bo'yicha qidiruv hech bir qatorni
  // topmaydi va qatorda eski ism qolib ketadi. `id` esa o'zgarmaydi.
  const replaceStudent = (saved: ApiStudent) => {
    setStudents((list) => (list ?? []).map((item) => (item.id === saved.id ? saved : item)));
  };

  const visibleCount = students?.filter((s) => s.is_active).length ?? 0;

  return (
    <div className="space-y-8">
      {/* Forma hech qachon unmount bo'lmaydi: xato chiqsa ham
          "qo'shildi" xabari ekranda qoladi. */}
      <AddStudentForm onAdded={() => load(true)} />

      <div>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-lg font-bold">O&apos;quvchilarim</h3>
          {students !== null && students.length > 0 && (
            <p className="text-sm text-ink-600 dark:text-ink-400">
              {students.length} ta o&apos;quvchi
              {visibleCount !== students.length && ` · ${visibleCount} tasi ko'rinadi`}
            </p>
          )}
        </div>

        {error && (
          <div
            role="alert"
            className="mb-4 rounded-2xl border-2 border-brand-600/40 bg-brand-50 p-4 dark:bg-brand-950/40"
          >
            <p className="text-sm font-semibold text-brand-700 dark:text-brand-300">{error}</p>
            <p className="mt-1 text-[13px] text-ink-700 dark:text-ink-300">
              Ro&apos;yxat yangilanmagan bo&apos;lishi mumkin. Qo&apos;shgan
              o&apos;quvchingiz pastda ko&apos;rinmasa, uni qaytadan
              kiritmang — avval ro&apos;yxatni yangilang.
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-3"
              onClick={() => load()}
            >
              Ro&apos;yxatni yangilash
            </Button>
          </div>
        )}

        {students === null ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-28 w-full rounded-2xl" />
            ))}
          </div>
        ) : students.length === 0 ? (
          // Xato bo'lsa ro'yxat bo'sh ko'rinadi, lekin u haqiqatda bo'sh
          // bo'lmasligi mumkin — "hali o'quvchi yo'q" deb aldamaymiz.
          error ? null : (
            <EmptyState
              icon="🎒"
              title="Hali o'quvchi qo'shilmagan"
              hint="Yuqoridagi formaga o'quvchining ism-familiyasini yozib, “Qo'shish”ni bosing."
            />
          )
        ) : (
          <>
            <ul className="space-y-3">
              {students.map((student) => (
                <li key={student.id}>
                  <StudentRow student={student} onSaved={replaceStudent} />
                </li>
              ))}
            </ul>

            <p className="mt-4 text-[13px] text-ink-600 dark:text-ink-400">
              “Yashirish” o&apos;quvchini sahifalardan olib qo&apos;yadi, lekin uning
              ishlari va buyurtma tarixi saqlanib qoladi. Istagan vaqtda qaytarib
              ko&apos;rsatasiz — o&apos;quvchi butunlay yo&apos;qolmaydi.
            </p>
          </>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------- o'quvchi qo'shish */

function AddStudentForm({ onAdded }: { onAdded: () => void }) {
  const [fullName, setFullName] = useState("");
  const [grade, setGrade] = useState("");
  const [avatar, pickAvatar] = usePickedImage();
  const fileRef = useRef<HTMLInputElement>(null);

  const [busy, setBusy] = useState(false);
  // Maydon xatosi aynan maydon OSTIDA chiqadi va ramka qizaradi — telefonda
  // uzun formada o'qituvchi qaysi maydon ekanini darhol ko'radi.
  const [nameError, setNameError] = useState("");
  const [error, setError] = useState("");
  // Xabar uchun o'quvchining o'zi saqlanadi: keyingi qadam — uning ishini
  // qo'yish, shuning uchun xabarda uning `slug`iga tugma kerak.
  const [added, setAdded] = useState<ApiStudent | null>(null);

  const clearFile = () => {
    pickAvatar(null);
    // Bir xil faylni qayta tanlash mumkin bo'lsin — input qiymati ham tozalanadi
    if (fileRef.current) fileRef.current.value = "";
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setNameError("");
    setAdded(null);

    const name = fullName.trim();
    if (name.length < 3) {
      setNameError("Ism-familiyani to'liq yozing (kamida 3 harf)");
      return;
    }

    setBusy(true);
    try {
      const form = new FormData();
      form.append("full_name", name);
      form.append("student_grade", grade.trim());
      if (avatar) form.append("avatar", avatar.file);

      const created = await api.createStudent(form);
      setAdded(created);
      setFullName("");
      setGrade("");
      clearFile();
      onAdded();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "O'quvchi qo'shilmadi");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="rounded-[var(--radius-card)] border bg-[var(--surface)] p-6">
      <h3 className="text-lg font-bold">O&apos;quvchi qo&apos;shish</h3>
      <p className="mt-1 text-[13px] text-ink-600 dark:text-ink-400">
        Faqat ism-familiya yozilsa ham bo&apos;ladi. Qolganini keyin
        qo&apos;shib qo&apos;yish mumkin.
      </p>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <Input
          id="new-student-name"
          label="Ism-familiya"
          value={fullName}
          onChange={(e) => {
            setFullName(e.target.value);
            setNameError("");
          }}
          placeholder="Masalan: Ali Valiyev"
          error={nameError}
          disabled={busy}
        />
        <Input
          id="new-student-grade"
          label="Sinf"
          hint="Ixtiyoriy"
          value={grade}
          onChange={(e) => setGrade(e.target.value)}
          placeholder="7-A"
          disabled={busy}
        />
      </div>

      {/* rasm */}
      <div className="mt-5 flex items-center gap-4">
        <div className="size-16 shrink-0 overflow-hidden rounded-2xl bg-ink-100 dark:bg-ink-800">
          {avatar ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={avatar.url} alt="" className="size-full object-cover" />
          ) : (
            <span className="grid size-full place-items-center font-display text-xl font-extrabold text-ink-400">
              {initialOf(fullName)}
            </span>
          )}
        </div>

        <div>
          <label
            htmlFor="new-student-avatar"
            className="inline-block cursor-pointer rounded-full bg-ink-900 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-ink-700 dark:bg-ink-100 dark:text-ink-950 dark:hover:bg-white"
          >
            Rasm tanlash
          </label>
          <input
            id="new-student-avatar"
            ref={fileRef}
            type="file"
            accept="image/*"
            className="sr-only"
            disabled={busy}
            onChange={(e) => pickAvatar(e.target.files?.[0] ?? null)}
          />
          <p className="mt-2 text-[13px] text-ink-600 dark:text-ink-400">
            Ixtiyoriy.{" "}
            {avatar && (
              <button
                type="button"
                onClick={clearFile}
                className="font-medium text-brand-600 hover:underline"
              >
                Rasmni olib tashlash
              </button>
            )}
          </p>
        </div>
      </div>

      <p className="mt-5 rounded-2xl bg-[var(--bg)] p-4 text-[13px] text-ink-700 dark:text-ink-300">
        O&apos;quvchi shu zahoti ro&apos;yxatda paydo bo&apos;ladi — hech kimning
        tasdig&apos;ini kutish kerak emas. Keyin uning nomidan ish qo&apos;ya
        olasiz. O&apos;quvchi tizimga kirmaydi: hammasini siz boshqarasiz.
      </p>

      {error && (
        <p role="alert" className="mt-4 text-sm font-medium text-brand-600">
          {error}
        </p>
      )}

      {added && (
        <div role="status" className="mt-4 rounded-2xl bg-success/10 p-4">
          <p className="text-sm font-semibold text-success">{added.full_name} qo&apos;shildi.</p>
          <p className="mt-1 text-[13px] text-ink-700 dark:text-ink-300">
            Keyingi qadam — uning birinchi ishini qo&apos;yish.
          </p>
          <Button href={`/mahsulot/yangi?oquvchi=${added.slug}`} size="sm" className="mt-3">
            {added.full_name} ishini qo&apos;shish
          </Button>
        </div>
      )}

      <div className="mt-6">
        <Button type="submit" disabled={busy}>
          {busy ? "Qo'shilmoqda…" : "Qo'shish"}
        </Button>
      </div>
    </form>
  );
}

/* ------------------------------------------------------------- ro'yxat qatori */

function StudentRow({
  student,
  onSaved,
}: {
  student: ApiStudent;
  onSaved: (saved: ApiStudent) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const toggleVisible = async () => {
    setBusy(true);
    setError("");
    try {
      // O'quvchi o'chirilmaydi — faqat ko'rinishi yoqib-o'chiriladi
      onSaved(await api.updateStudent(student.slug, { is_active: !student.is_active }));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Amal bajarilmadi");
    } finally {
      setBusy(false);
    }
  };

  return (
    <article
      className={cn(
        "rounded-2xl border bg-[var(--surface)] p-5 transition-opacity duration-300",
        "[transition-timing-function:var(--ease-out-soft)]",
        !student.is_active && "opacity-60",
      )}
    >
      <div className="flex flex-wrap items-start gap-4">
        {student.avatar ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img src={student.avatar} alt="" className="size-14 shrink-0 rounded-2xl object-cover" />
        ) : (
          <span className="grid size-14 shrink-0 place-items-center rounded-2xl bg-brand-600 font-display text-xl font-extrabold text-white">
            {initialOf(student.full_name)}
          </span>
        )}

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h4 className="font-bold">{student.full_name}</h4>
            {student.student_grade && <Badge tone="neutral">{student.student_grade}</Badge>}
            {!student.is_active && <Badge tone="gold">Yashirilgan</Badge>}
          </div>

          <p className="mt-1 text-[13px] text-ink-600 dark:text-ink-400">
            {student.products_count} ta ishi · {student.sold_count} tasi sotilgan
          </p>

          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm font-medium">
            {/* Yashirilgan o'quvchida bu ikki havola boshi berk ko'chaga
                olib boradi: sahifasi 404 qaytaradi, mahsulot formasi esa
                uni ro'yxatda ko'rsatmaydi. Shuning uchun ko'rsatilmaydi. */}
            {student.is_active && (
              <>
                <Button href={`/mahsulot/yangi?oquvchi=${student.slug}`} size="sm">
                  Ish qo&apos;shish
                </Button>
                <Link
                  href={`/hunarmandlar/${student.slug}`}
                  className="text-brand-600 hover:underline"
                >
                  Sahifasi
                </Link>
              </>
            )}
            <button
              type="button"
              onClick={() => setEditing((v) => !v)}
              className="text-ink-700 transition-colors hover:text-brand-600 dark:text-ink-300"
            >
              {editing ? "Yopish" : "Tahrirlash"}
            </button>
            <button
              type="button"
              onClick={toggleVisible}
              disabled={busy}
              className="text-ink-700 transition-colors hover:text-brand-600 disabled:opacity-50 dark:text-ink-300"
            >
              {busy ? "…" : student.is_active ? "Yashirish" : "Ko'rsatish"}
            </button>
          </div>

          {!student.is_active && (
            <p className="mt-2 text-[13px] text-ink-600 dark:text-ink-400">
              Sahifalarda ko&apos;rinmaydi, ishlari saqlanib qolgan. Ish
              qo&apos;shish yoki sahifasini ochish uchun avval
              “Ko&apos;rsatish”ni bosing.
            </p>
          )}

          {error && (
            <p role="alert" className="mt-3 text-sm font-medium text-brand-600">
              {error}
            </p>
          )}
        </div>
      </div>

      {editing && (
        <StudentEditForm
          student={student}
          onSaved={(saved) => {
            onSaved(saved);
            setEditing(false);
          }}
        />
      )}
    </article>
  );
}

function StudentEditForm({
  student,
  onSaved,
}: {
  student: ApiStudent;
  onSaved: (saved: ApiStudent) => void;
}) {
  const [fullName, setFullName] = useState(student.full_name);
  const [grade, setGrade] = useState(student.student_grade);
  const [avatar, pickAvatar] = usePickedImage();

  const [busy, setBusy] = useState(false);
  const [nameError, setNameError] = useState("");
  const [error, setError] = useState("");

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setNameError("");

    const name = fullName.trim();
    if (name.length < 3) {
      setNameError("Ism-familiyani to'liq yozing (kamida 3 harf)");
      return;
    }

    setBusy(true);
    try {
      const form = new FormData();
      form.append("full_name", name);
      form.append("student_grade", grade.trim());
      // Rasm tanlanmasa `avatar` yuborilmaydi — mavjud rasm o'z joyida qoladi
      if (avatar) form.append("avatar", avatar.file);
      onSaved(await api.updateStudent(student.slug, form));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Saqlanmadi");
      setBusy(false);
    }
  };

  return (
    <form onSubmit={save} className="mt-5 space-y-4 rounded-2xl bg-[var(--bg)] p-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          id={`student-name-${student.id}`}
          label="Ism-familiya"
          value={fullName}
          onChange={(e) => {
            setFullName(e.target.value);
            setNameError("");
          }}
          error={nameError}
          disabled={busy}
        />
        <Input
          id={`student-grade-${student.id}`}
          label="Sinf"
          hint="Ixtiyoriy"
          value={grade}
          onChange={(e) => setGrade(e.target.value)}
          placeholder="7-A"
          disabled={busy}
        />
      </div>

      <div className="flex items-center gap-4">
        <div className="size-14 shrink-0 overflow-hidden rounded-2xl bg-ink-100 dark:bg-ink-800">
          {avatar || student.avatar ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={avatar?.url ?? student.avatar ?? ""}
              alt=""
              className="size-full object-cover"
            />
          ) : (
            <span className="grid size-full place-items-center font-display text-lg font-extrabold text-ink-400">
              {initialOf(fullName)}
            </span>
          )}
        </div>

        <div>
          <label
            htmlFor={`student-avatar-${student.id}`}
            className="inline-block cursor-pointer rounded-full border-2 border-[var(--line)] px-5 py-2.5 text-sm font-semibold transition-colors duration-300 hover:border-brand-600 hover:text-brand-600"
          >
            Rasmni almashtirish
          </label>
          <input
            id={`student-avatar-${student.id}`}
            type="file"
            accept="image/*"
            className="sr-only"
            disabled={busy}
            onChange={(e) => pickAvatar(e.target.files?.[0] ?? null)}
          />
        </div>
      </div>

      {error && (
        <p role="alert" className="text-sm font-medium text-brand-600">
          {error}
        </p>
      )}

      <Button type="submit" size="sm" disabled={busy}>
        {busy ? "Saqlanmoqda…" : "Saqlash"}
      </Button>
    </form>
  );
}
