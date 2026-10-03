"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState, ErrorState } from "@/components/ui/PageHeader";
import { adminApi, ApiError, type AdminSchool, type ApiStudent } from "@/lib/api";
import {
  cn,
  formatDate,
  initialOf,
  normalizeSchoolLogin,
  SCHOOL_LOGIN_RE,
} from "@/lib/utils";

const LOGIN_HINT =
  "Kichik lotin harflari, raqam va chiziqcha; 3-40 belgi. Masalan: 12-maktab";

// Tasdiq holati shuncha vaqtdan keyin o'zi bekor bo'ladi — admin boshqa ishga
// o'tib ketsa, tugma "bir bosishda ketadigan" holatda qolib qolmasin.
const CONFIRM_MS = 5000;

/**
 * Parol backenddan FAQAT bir marta keladi — maktab ochilganda va parol
 * yangilanganda. Shu sababli uni ro'yxat ichiga yashirmasdan, sahifa tepasida
 * alohida kartada ko'rsatamiz: karta yopilgandan keyin parolni hech kim,
 * admin ham ko'ra olmaydi.
 *
 * Karta holati ATAYLAB `AdminPageClient` da turadi: tab almashsa bu komponent
 * unmount bo'ladi va karta u bilan birga yo'qolib ketardi — ya'ni admin nusxa
 * olishga ulgurmay parolni butunlay yo'qotardi.
 */
export type SchoolSecret = {
  title: string;
  schoolName: string;
  login: string;
  password: string;
};

export function AdminSchools({
  onSecret,
  onChange,
}: {
  onSecret: (secret: SchoolSecret) => void;
  // Maktab ochilganda/to'xtatilganda "Statistika" bo'limidagi raqamlar
  // ham yangilanishi kerak — aks holda admin yangi ochgan maktabini
  // sanoqda ko'rmay, nimadir ishlamadi deb o'ylaydi.
  onChange: () => void;
}) {
  const [schools, setSchools] = useState<AdminSchool[] | null>(null);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const load = useCallback(
    async (silent = false) => {
      if (!silent) setSchools(null);
      setError("");
      try {
        const params: Record<string, string> = {};
        if (search.trim()) params.search = search.trim();
        setSchools(await adminApi.schools(params));
      } catch (err) {
        setError(err instanceof ApiError ? err.message : "Yuklab bo'lmadi");
        setSchools([]);
      }
    },
    [search],
  );

  useEffect(() => {
    const timer = setTimeout(() => load(), search ? 350 : 0);
    return () => clearTimeout(timer);
  }, [load, search]);

  const patchSchool = (updated: AdminSchool) => {
    setSchools((list) => list?.map((s) => (s.id === updated.id ? updated : s)) ?? null);
    // To'xtatilgan maktab statistikadagi "Maktablar" sanog'idan chiqadi
    onChange();
  };

  return (
    <div className="space-y-8">
      <div className="rounded-[var(--radius-card)] border bg-[var(--surface)] p-6">
        <h3 className="text-lg font-bold">Maktablar qanday ishlaydi</h3>
        <ol className="mt-3 space-y-2 text-[14px] text-ink-700 dark:text-ink-300">
          <li>1. Siz maktab ochasiz — tizim unga login va parol beradi.</li>
          <li>2. Login va parolni maktabga topshirasiz.</li>
          <li>
            3. Maktab shu login bilan kiradi va o&apos;z o&apos;quvchilarini
            o&apos;zi kiritadi.
          </li>
        </ol>
        <p className="mt-3 text-[13px] text-ink-600 dark:text-ink-400">
          O&apos;quvchilarni tasdiqlash kerak emas — maktab bolani kiritgan
          zahoti u saytda paydo bo&apos;ladi.
        </p>
      </div>

      <AddSchoolForm
        onCreated={(next) => {
          onSecret(next);
          load(true);
          onChange();
        }}
      />

      <div>
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-lg font-bold">
            Maktablar
            {schools !== null && (
              <span className="ml-2 text-sm font-medium text-ink-600 dark:text-ink-400">
                {schools.length} ta
              </span>
            )}
          </h3>

          <div className="min-w-56 flex-1 sm:max-w-xs">
            <label htmlFor="school-search" className="sr-only">
              Maktab qidirish
            </label>
            <input
              id="school-search"
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Nom, login yoki viloyat…"
              className="h-11 w-full rounded-full border-2 border-[var(--line)] bg-[var(--surface)] px-5 text-[15px] transition-colors outline-none focus:border-brand-600"
            />
          </div>
        </div>

        {schools === null ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-32 w-full rounded-2xl" />
            ))}
          </div>
        ) : error ? (
          <ErrorState message={error} onRetry={() => load()} />
        ) : schools.length === 0 ? (
          <EmptyState
            title={search ? "Maktab topilmadi" : "Hali maktab ochilmagan"}
            hint={
              search
                ? "Qidiruvni o'zgartirib ko'ring."
                : "Yuqoridagi formadan birinchi maktabni oching."
            }
          />
        ) : (
          <ul className="space-y-3">
            {schools.map((school) => (
              <li key={school.id}>
                <SchoolRow school={school} onSecret={onSecret} onUpdated={patchSchool} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------- login va parol kartasi */

export function SchoolSecretCard({
  secret,
  onClose,
}: {
  secret: SchoolSecret;
  onClose: () => void;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<"idle" | "copied" | "selected">("idle");
  const [askClose, setAskClose] = useState(false);

  // Parol ro'yxatning pastidagi tugmadan ham kelishi mumkin — shuning uchun
  // karta o'zini ko'rinadigan joyga suradi.
  useEffect(() => {
    cardRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, []);

  const copy = async () => {
    setAskClose(false);
    const text = `Login: ${secret.login}\nParol: ${secret.password}`;
    try {
      await navigator.clipboard.writeText(text);
      setState("copied");
      return;
    } catch {
      // navigator.clipboard himoyalanmagan ulanishda yoki eski brauzerda
      // bo'lmaydi — pastdagi zaxira yo'lga o'tamiz.
    }

    const node = textRef.current;
    const selection = window.getSelection();
    if (node && selection) {
      const range = document.createRange();
      range.selectNodeContents(node);
      selection.removeAllRanges();
      selection.addRange(range);
      setState("selected");
    }
  };

  // Nusxa olinmagan parolni bir bosishda yopish — uni butunlay yo'qotish.
  // Shuning uchun bu holatda bir marta so'raymiz.
  const close = () => {
    if (state === "idle" && !askClose) {
      setAskClose(true);
      return;
    }
    onClose();
  };

  return (
    <div
      ref={cardRef}
      role="status"
      className="rounded-[var(--radius-card)] border-2 border-brand-600 bg-brand-50 p-6 dark:bg-brand-950"
    >
      <p className="text-[11px] font-semibold tracking-[0.12em] text-brand-700 uppercase dark:text-brand-300">
        {secret.title}
      </p>
      <p className="mt-2 font-display text-xl font-bold">{secret.schoolName}</p>

      <p className="mt-3 font-semibold text-brand-700 dark:text-brand-300">
        Bu parol boshqa ko&apos;rinmaydi — maktabga hozir topshiring.
      </p>

      <div ref={textRef} className="mt-5 space-y-3 rounded-2xl border bg-[var(--surface)] p-5">
        <div>
          <p className="text-[12px] font-medium text-ink-600 dark:text-ink-400">Login</p>
          <p className="mt-1 font-mono text-xl font-bold break-all select-all sm:text-2xl">
            {secret.login}
          </p>
        </div>
        <div>
          <p className="text-[12px] font-medium text-ink-600 dark:text-ink-400">Parol</p>
          <p className="mt-1 font-mono text-xl font-bold break-all select-all sm:text-2xl">
            {secret.password}
          </p>
        </div>
      </div>

      <p className="mt-4 text-[13px] text-ink-700 dark:text-ink-300">
        Parol yo&apos;qolsa, maktablar ro&apos;yxatidan shu maktabni topib
        “Parolni yangilash” tugmasi bilan yangisini olish mumkin. Lekin
        o&apos;sha paytda eski parol ishlamay qoladi — maktab endi yangi parol
        bilan kiradi.
      </p>

      {askClose && (
        <p
          role="alert"
          className="mt-4 rounded-2xl border-2 border-brand-600 bg-[var(--surface)] p-4 text-[13px] font-semibold text-brand-700 dark:text-brand-300"
        >
          Parolni nusxa olmadingiz. Yopilsa, u boshqa ko&apos;rinmaydi.
          Yopilsinmi?
        </p>
      )}

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={copy}
          className="rounded-full bg-brand-600 px-6 py-2.5 text-sm font-semibold text-white transition-all duration-300 hover:-translate-y-0.5 hover:bg-brand-700"
        >
          {state === "copied" ? "Nusxa olindi" : "Nusxa olish"}
        </button>

        <button
          type="button"
          onClick={close}
          className={cn(
            "rounded-full border-2 px-5 py-2.5 text-sm font-semibold transition-colors duration-300",
            askClose
              ? "border-brand-600 bg-brand-600 text-white"
              : "border-[var(--line)] hover:border-brand-600 hover:text-brand-600",
          )}
        >
          {askClose ? "Ha, yopilsin" : "Yopish"}
        </button>

        {askClose && (
          <button
            type="button"
            onClick={() => setAskClose(false)}
            className="rounded-full px-4 py-2.5 text-sm font-semibold text-ink-700 transition-colors duration-300 hover:text-brand-600 dark:text-ink-300"
          >
            Bekor qilish
          </button>
        )}

        {state === "selected" && (
          <span className="text-[13px] text-ink-600 dark:text-ink-400">
            Matn tanlandi — Ctrl+C bosib nusxa oling.
          </span>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------ yangi maktab */

function AddSchoolForm({ onCreated }: { onCreated: (secret: SchoolSecret) => void }) {
  const [name, setName] = useState("");
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [region, setRegion] = useState("");
  const [district, setDistrict] = useState("");
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<{
    name?: string;
    login?: string;
    password?: string;
  }>({});

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");

    const next: { name?: string; login?: string; password?: string } = {};
    if (!name.trim()) next.name = "Maktab nomini yozing";
    // Kirish sahifasi bilan BIR XIL qoida: @/lib/utils dagi yagona manba
    if (!SCHOOL_LOGIN_RE.test(login)) next.login = LOGIN_HINT;
    if (password && password.length < 6) next.password = "Kamida 6 belgi bo'lishi kerak";

    setFieldErrors(next);
    if (Object.keys(next).length > 0) return;

    setBusy(true);
    try {
      const result = await adminApi.createSchool({
        login,
        name_uz: name.trim(),
        // Bo'sh parol yuborilmaydi — shunda backend o'zi yaratadi
        ...(password ? { password } : {}),
        ...(region.trim() ? { region: region.trim() } : {}),
        ...(district.trim() ? { district: district.trim() } : {}),
        ...(phone.trim() ? { contact_phone: phone.trim() } : {}),
      });

      onCreated({
        title: "Maktab ochildi",
        schoolName: result.school.name_uz || name.trim(),
        login: result.login,
        password: result.password,
      });

      setName("");
      setLogin("");
      setPassword("");
      setRegion("");
      setDistrict("");
      setPhone("");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Maktab ochilmadi");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="rounded-[var(--radius-card)] border bg-[var(--surface)] p-6">
      <h3 className="text-lg font-bold">Yangi maktab</h3>
      <p className="mt-1 text-[13px] text-ink-600 dark:text-ink-400">
        Nom va login yetarli. Qolgan maydonlarni keyinchalik maktabning
        o&apos;zi to&apos;ldirishi mumkin.
      </p>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <Input
          id="school-name"
          label="Maktab nomi"
          placeholder="Chilonzor tumani 12-maktab"
          value={name}
          onChange={(e) => setName(e.target.value)}
          error={fieldErrors.name}
          disabled={busy}
        />
        <Input
          id="school-login"
          label="Login"
          hint={LOGIN_HINT}
          placeholder="12-maktab"
          className="font-mono"
          autoComplete="off"
          value={login}
          onChange={(e) => setLogin(normalizeSchoolLogin(e.target.value))}
          error={fieldErrors.login}
          disabled={busy}
        />
        <Input
          id="school-password"
          label="Parol"
          hint="Bo'sh qoldirsangiz tizim o'zi yaratadi. Kamida 6 belgi."
          placeholder="Ixtiyoriy"
          className="font-mono"
          autoComplete="off"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={fieldErrors.password}
          disabled={busy}
        />
        <Input
          id="school-region"
          label="Viloyat"
          hint="Ixtiyoriy"
          placeholder="Toshkent shahri"
          value={region}
          onChange={(e) => setRegion(e.target.value)}
          disabled={busy}
        />
        <Input
          id="school-district"
          label="Tuman yoki shahar"
          hint="Ixtiyoriy"
          placeholder="Chilonzor"
          value={district}
          onChange={(e) => setDistrict(e.target.value)}
          disabled={busy}
        />
        <Input
          id="school-phone"
          label="Aloqa raqami"
          hint="Ixtiyoriy"
          inputMode="tel"
          placeholder="+998 90 123 45 67"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          disabled={busy}
        />
      </div>

      {error && (
        <p role="alert" className="mt-4 text-sm font-medium text-brand-600">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={busy}
        className="mt-6 rounded-full bg-brand-600 px-6 py-3 text-sm font-semibold text-white shadow-[var(--shadow-brand)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-brand-700 disabled:pointer-events-none disabled:opacity-50"
      >
        {busy ? "Ochilmoqda…" : "Maktabni ochish"}
      </button>
    </form>
  );
}

/* ----------------------------------------------------------- maktab qatori */

/** Qaytarib bo'lmaydigan amallar. */
type Danger = "password" | "active";

function SchoolRow({
  school,
  onSecret,
  onUpdated,
}: {
  school: AdminSchool;
  onSecret: (secret: SchoolSecret) => void;
  onUpdated: (school: AdminSchool) => void;
}) {
  const [busy, setBusy] = useState<Danger | null>(null);
  const [confirming, setConfirming] = useState<Danger | null>(null);
  const [error, setError] = useState("");
  const [open, setOpen] = useState(false);
  const [students, setStudents] = useState<ApiStudent[] | null>(null);
  const [studentsBusy, setStudentsBusy] = useState(false);

  // Tasdiq holati o'zi bekor bo'ladi: admin tugmani bosib qo'yib boshqa ishga
  // o'tsa, keyin shu tugmaga tasodifan bosilganda amal darrov ketmasin.
  useEffect(() => {
    if (!confirming) return;
    const timer = setTimeout(() => setConfirming(null), CONFIRM_MS);
    return () => clearTimeout(timer);
  }, [confirming]);

  /**
   * Qaytarib bo'lmaydigan amallar ikki qadamda: birinchi bosish faqat tasdiq
   * so'raydi, so'rov esa ikkinchi bosishda ketadi. 375px ekranda tugmalar
   * bir-birining ostiga tushadi — yonidagiga tasodifan bosilganda maktabning
   * ishlab turgan paroli o'lib ketmasligi kerak.
   *
   * Bir vaqtda faqat bitta tasdiq ochiq turadi.
   */
  const step = (kind: Danger, run: () => Promise<void>) => {
    if (confirming !== kind) {
      setError("");
      setConfirming(kind);
      return;
    }
    setConfirming(null);
    void run();
  };

  const resetPassword = async () => {
    setBusy("password");
    setError("");
    try {
      const result = await adminApi.resetSchoolPassword(school.id);
      onSecret({
        title: "Yangi parol",
        schoolName: school.name_uz,
        login: result.login,
        password: result.password,
      });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Parol yangilanmadi");
    } finally {
      setBusy(null);
    }
  };

  const toggleActive = async () => {
    setBusy("active");
    setError("");
    try {
      const result = await adminApi.toggleSchoolActive(school.id);
      onUpdated(result.school);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Amal bajarilmadi");
    } finally {
      setBusy(null);
    }
  };

  // Ro'yxat HAR ochilishda qayta so'raladi: maktab shu orada yangi bola
  // qo'shgan bo'lishi mumkin, eski ro'yxat esa yolg'on son ko'rsatadi.
  const toggleStudents = async () => {
    const next = !open;
    setOpen(next);
    if (!next) {
      // Keshni tashlaymiz: yopiq holatda son `school.students_count`
      // dan olinadi. Aks holda ro'yxat eski uzunlikda qotib qolardi —
      // maktab yangi bola qo'shsa ham admin eski sonni ko'rardi.
      setStudents(null);
      return;
    }

    setStudentsBusy(true);
    setError("");
    try {
      setStudents(await adminApi.schoolStudents(school.id));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "O'quvchilar yuklanmadi");
      setStudents([]);
    } finally {
      setStudentsBusy(false);
    }
  };

  const place = [school.region, school.district].filter(Boolean).join(", ");
  const mismatch = school.can_login !== school.is_active;
  // Ro'yxat bir marta yuklangan bo'lsa, tugmadagi son ham shundan olinadi —
  // tugmada 5, ro'yxatda 3 degan holat bo'lmasin.
  const count = students !== null ? students.length : school.students_count;

  return (
    <article
      className={cn(
        "rounded-2xl border-2 bg-[var(--surface)] p-5 transition-colors duration-300",
        school.is_active
          ? "border-[var(--line)]"
          : "border-dashed border-[var(--line)] bg-ink-100/60 dark:bg-ink-900/60",
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="font-display text-lg font-bold">{school.name_uz}</p>

          <p className="mt-1 font-mono text-[15px] font-semibold break-all select-all">
            {school.login}
          </p>

          <p className="mt-1 text-[12px] text-ink-600 dark:text-ink-400">
            {place && `${place} · `}
            {count} o&apos;quvchi · {formatDate(school.created_at)}
          </p>

          <Link
            href={`/maktablar/${school.slug}`}
            className="mt-2 inline-block text-[13px] font-semibold text-brand-600 hover:underline"
          >
            Maktab sahifasi
          </Link>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {school.is_active ? (
            <Badge tone="success">Faol</Badge>
          ) : (
            <Badge tone="neutral">To&apos;xtatilgan</Badge>
          )}

          {/* Sahifa holati bilan kirish huquqi mos kelmasa admin buni bilishi kerak */}
          {mismatch && (
            <Badge tone="brand">{school.can_login ? "Lekin kira oladi" : "Kira olmaydi"}</Badge>
          )}
        </div>
      </div>

      {mismatch && (
        <p className="mt-3 text-[12px] font-medium text-brand-600">
          Holat chalkash: sahifasi {school.is_active ? "ko'rinadi" : "yashirilgan"}, lekin
          tizimga {school.can_login ? "kira oladi" : "kira olmaydi"}. Pastdagi “
          {school.is_active ? "Vaqtincha to'xtatish" : "Qaytarish"}” tugmasi ikkisini
          birga to&apos;g&apos;rilaydi.
        </p>
      )}

      <div className="mt-4 border-t pt-4">
        {/* Xavfsiz amal — xavfli tugmalardan alohida qatorda turadi, 375px da
            ham ularning yoniga tushib qolmaydi. */}
        <button
          type="button"
          onClick={toggleStudents}
          aria-expanded={open}
          className="w-full rounded-full border-2 border-[var(--line)] px-4 py-2 text-[13px] font-semibold transition-colors duration-300 hover:border-brand-600 hover:text-brand-600 sm:w-auto"
        >
          O&apos;quvchilar ({count}) <span aria-hidden="true">{open ? "▲" : "▼"}</span>
        </button>

        {/* Ogohlantirish TUGMALARDAN YUQORIDA: odam uni bosgandan keyin emas,
            bosishdan oldin o'qishi kerak. */}
        <p className="mt-5 text-[12px] text-ink-600 dark:text-ink-400">
          Parolni yangilasangiz eskisi ishlamay qoladi — yangisini maktabga
          topshirish kerak bo&apos;ladi. To&apos;xtatilgan maktab tizimga kira
          olmaydi va sahifasi ko&apos;rinmaydi, lekin ma&apos;lumotlari ham,
          o&apos;quvchilari ham saqlanib qoladi.
        </p>

        {confirming && (
          <p
            role="alert"
            className="mt-3 rounded-xl border-2 border-brand-600 bg-brand-50 p-3 text-[13px] font-semibold text-brand-700 dark:bg-brand-950 dark:text-brand-300"
          >
            {confirming === "password"
              ? "Maktabning hozirgi paroli ishlamay qoladi va buni qaytarib bo'lmaydi. Rozi bo'lsangiz tugmani yana bir bosing."
              : school.is_active
                ? "Maktab tizimga kira olmaydi, sahifasi va o'quvchilari saytda yopiladi. Rozi bo'lsangiz tugmani yana bir bosing."
                : "Maktab yana tizimga kiradi, sahifasi va o'quvchilari saytda ochiladi. Rozi bo'lsangiz tugmani yana bir bosing."}
          </p>
        )}

        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => step("password", resetPassword)}
            disabled={busy !== null}
            className={cn(
              "rounded-full border-2 px-4 py-2 text-[13px] font-semibold transition-colors duration-300 disabled:opacity-50",
              confirming === "password"
                ? "border-brand-600 bg-brand-600 text-white"
                : "border-[var(--line)] hover:border-brand-600 hover:text-brand-600",
            )}
          >
            {busy === "password"
              ? "…"
              : confirming === "password"
                ? "Ha, yangilansin"
                : "Parolni yangilash"}
          </button>

          <button
            type="button"
            onClick={() => step("active", toggleActive)}
            disabled={busy !== null}
            className={cn(
              "rounded-full border-2 px-4 py-2 text-[13px] font-semibold transition-colors duration-300 disabled:opacity-50",
              confirming === "active"
                ? "border-brand-600 bg-brand-600 text-white"
                : school.is_active
                  ? "border-[var(--line)] hover:border-brand-600 hover:text-brand-600"
                  : "border-ink-900 bg-ink-900 text-white dark:border-ink-100 dark:bg-ink-100 dark:text-ink-950",
            )}
          >
            {busy === "active"
              ? "…"
              : confirming === "active"
                ? school.is_active
                  ? "Ha, to'xtatilsin"
                  : "Ha, qaytarilsin"
                : school.is_active
                  ? "Vaqtincha to'xtatish"
                  : "Qaytarish"}
          </button>
        </div>

        {error && (
          <p role="alert" className="mt-3 text-sm font-medium text-brand-600">
            {error}
          </p>
        )}

        {open && (
          <div className="mt-4 border-t pt-4">
            {studentsBusy || students === null ? (
              <div className="space-y-2">
                {Array.from({ length: 2 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full rounded-xl" />
                ))}
              </div>
            ) : students.length === 0 ? (
              <p className="text-[13px] text-ink-600 dark:text-ink-400">
                Maktab hali o&apos;quvchi kiritmagan.
              </p>
            ) : (
              <ul className="space-y-2">
                {students.map((student) => (
                  <li key={student.id}>
                    <StudentLine student={student} />
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </article>
  );
}

function StudentLine({ student }: { student: ApiStudent }) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-3 rounded-xl border p-3",
        !student.is_active && "opacity-70",
      )}
    >
      {student.avatar ? (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img src={student.avatar} alt="" className="size-10 rounded-lg object-cover" />
      ) : (
        <span className="grid size-10 place-items-center rounded-lg bg-ink-200 text-sm font-bold dark:bg-ink-800">
          {initialOf(student.full_name)}
        </span>
      )}

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={`/hunarmandlar/${student.slug}`}
            className="font-semibold transition-colors duration-300 hover:text-brand-600"
          >
            {student.full_name}
          </Link>
          {!student.is_active && <Badge tone="neutral">Yashirilgan</Badge>}
        </div>

        <p className="mt-0.5 text-[12px] text-ink-600 dark:text-ink-400">
          {student.student_grade && `${student.student_grade} · `}
          {student.products_count} ta ish
          {student.sold_count > 0 && ` · ${student.sold_count} sotilgan`}
        </p>
      </div>
    </div>
  );
}
