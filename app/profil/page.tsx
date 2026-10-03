"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input, Textarea, Select } from "@/components/ui/Input";
import { PageLoader } from "@/components/ui/Skeleton";
import { useAuth } from "@/components/auth/AuthProvider";
import { LinkedAccounts } from "@/components/profile/LinkedAccounts";
import { MyOrders } from "@/components/profile/MyOrders";
import { MyProducts } from "@/components/profile/MyProducts";
import { MyBalance } from "@/components/profile/MyBalance";
import { MyReviews } from "@/components/profile/MyReviews";
import { MyStats } from "@/components/profile/MyStats";
import { Notifications } from "@/components/profile/Notifications";
import { SchoolStudents } from "@/components/school/SchoolStudents";
import { MySchool } from "@/components/school/MySchool";
import { api, ApiError, type ApiApplication, type ApiCraft } from "@/lib/api";
import { cn, initialOf } from "@/lib/utils";

type TabId =
  | "buyurtmalar"
  | "sharhlar"
  | "bildirishnoma"
  | "malumot"
  | "dokon"
  | "mahsulotlar"
  | "statistika"
  | "balans"
  | "oquvchilar"
  | "maktab";

export default function ProfilePage() {
  const router = useRouter();
  const { user, loading, logout, refreshUser } = useAuth();
  // `null` — foydalanuvchi hali bo'lim tanlamagan. Boshlang'ich bo'lim
  // `user` yuklangach hisoblanadi (maktabda u "o'quvchilar" bo'lishi kerak,
  // lekin birinchi renderda `user` hali yo'q).
  const [chosenTab, setChosenTab] = useState<TabId | null>(null);

  useEffect(() => {
    if (!loading && !user) router.replace("/kirish");
  }, [loading, user, router]);

  if (loading) return <PageLoader label="Profil yuklanmoqda" />;
  if (!user) return null;

  const tab: TabId = chosenTab ?? (user.is_school ? "oquvchilar" : "buyurtmalar");

  const heading = user.full_name || (user.is_school ? "Maktab" : "Ismsiz foydalanuvchi");
  // Maktab akkauntida telefon YO'Q (null) — uning o'rnida maktab nomi
  // ko'rinadi. Sarlavhada allaqachon shu nom turgan bo'lsa takrorlamaymiz.
  const subtitle = user.is_school
    ? user.school_name === heading
      ? ""
      : user.school_name
    : user.phone;

  const tabs: { id: TabId; label: string }[] = [];
  if (user.is_school) {
    // Maktab xarid qilmaydi, sotadi: buyurtma, sharh va "Do'kon ochish"
    // bo'limlari unga keraksiz (backend maktabdan ariza ham qabul qilmaydi).
    tabs.push({ id: "oquvchilar", label: "O'quvchilar" });
    tabs.push({ id: "mahsulotlar", label: "Mahsulotlar" });
    tabs.push({ id: "statistika", label: "Do'kon statistikasi" });
    tabs.push({ id: "balans", label: "Balans" });
    tabs.push({ id: "maktab", label: "Maktab sahifasi" });
    tabs.push({ id: "bildirishnoma", label: "Bildirishnomalar" });
  } else if (user.is_artisan) {
    tabs.push({ id: "buyurtmalar", label: "Buyurtmalarim" });
    tabs.push({ id: "sharhlar", label: "Sharhlarim" });
    tabs.push({ id: "bildirishnoma", label: "Bildirishnomalar" });
    tabs.push({ id: "malumot", label: "Ma'lumotlarim" });
    tabs.push({ id: "mahsulotlar", label: "Mahsulotlarim" });
    tabs.push({ id: "statistika", label: "Do'kon statistikasi" });
    tabs.push({ id: "balans", label: "Balans" });
  } else {
    tabs.push({ id: "buyurtmalar", label: "Buyurtmalarim" });
    tabs.push({ id: "sharhlar", label: "Sharhlarim" });
    tabs.push({ id: "bildirishnoma", label: "Bildirishnomalar" });
    tabs.push({ id: "malumot", label: "Ma'lumotlarim" });
    tabs.push({ id: "dokon", label: "Do'kon ochish" });
  }

  return (
    <Container className="py-12 lg:py-16">
      <div className="mx-auto max-w-6xl">
        {/* sarlavha */}
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            {user.avatar ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img src={user.avatar} alt="" className="size-14 rounded-2xl object-cover" />
            ) : (
              <span className="grid size-14 place-items-center rounded-2xl bg-brand-600 font-display text-xl font-extrabold text-white">
                {initialOf(user.full_name, user.phone)}
              </span>
            )}
            <div>
              <h1 className="text-2xl font-extrabold">{heading}</h1>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-ink-600 dark:text-ink-400">
                {subtitle && <span>{subtitle}</span>}
                <Badge tone={user.is_school || user.is_artisan ? "gold" : "neutral"}>
                  {user.is_school ? "Maktab" : user.is_artisan ? "Hunarmand" : "Foydalanuvchi"}
                </Badge>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={logout}
            className="rounded-full border-2 border-[var(--line)] px-5 py-2.5 text-sm font-semibold transition-colors duration-300 hover:border-brand-600 hover:text-brand-600"
          >
            Chiqish
          </button>
        </div>

        {/* bo'limlar */}
        <div className="lg:grid lg:grid-cols-[240px_1fr] lg:items-start lg:gap-8">
          <nav
            role="tablist"
            aria-label="Profil bo'limlari"
            className="mb-6 flex gap-2 overflow-x-auto pb-1 lg:mb-0 lg:flex-col lg:overflow-visible lg:pb-0"
          >
            {tabs.map((item) => (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={tab === item.id}
                onClick={() => setChosenTab(item.id)}
                className={cn(
                  "shrink-0 rounded-2xl px-4 py-3 text-left text-sm font-semibold whitespace-nowrap transition-colors duration-300 lg:shrink lg:whitespace-normal",
                  tab === item.id
                    ? "bg-brand-600 text-white"
                    : "text-ink-700 hover:bg-ink-900/[0.05] dark:text-ink-300 dark:hover:bg-ink-100/10",
                )}
              >
                {item.label}
              </button>
            ))}
          </nav>

          <div className="min-w-0">
            {tab === "buyurtmalar" && <MyOrders />}
            {tab === "sharhlar" && <MyReviews />}
            {tab === "bildirishnoma" && <Notifications />}
            {tab === "malumot" && (
              <div className="space-y-6">
                <ProfileForm onSaved={refreshUser} />
                <LinkedAccounts />
              </div>
            )}
            {tab === "dokon" && <ShopApplication />}
            {tab === "oquvchilar" && <SchoolStudents />}
            {tab === "maktab" && <MySchool />}
            {tab === "mahsulotlar" && (
              <ShopTabHeader title={user.is_school ? "O'quvchilar ishlari" : "Mahsulotlarim"}>
                <MyProducts />
              </ShopTabHeader>
            )}
            {tab === "balans" && <MyBalance />}
            {tab === "statistika" && (
              <ShopTabHeader title="Do'kon statistikasi">
                <MyStats />
              </ShopTabHeader>
            )}
          </div>
        </div>
      </div>
    </Container>
  );
}

/* ------------------------------------------------------------- hunarmand sarlavhasi */

function ShopTabHeader({ title, children }: { title: string; children: React.ReactNode }) {
  const { user } = useAuth();
  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-bold">{title}</h2>
        {/* Maktabning ommaviy sahifasi do'kon emas — boshqa manzil, boshqa matn */}
        {user?.is_school ? (
          user.school_slug && (
            <Link
              href={`/maktablar/${user.school_slug}`}
              className="text-sm font-medium text-brand-600 hover:underline"
            >
              Maktab sahifamni ko&apos;rish →
            </Link>
          )
        ) : (
          user?.artisan_slug && (
            <Link
              href={`/hunarmandlar/${user.artisan_slug}`}
              className="text-sm font-medium text-brand-600 hover:underline"
            >
              Do&apos;konimni ko&apos;rish →
            </Link>
          )
        )}
      </div>
      {children}
    </div>
  );
}

/* ------------------------------------------------------------- ma'lumotlarim */

function ProfileForm({ onSaved }: { onSaved: () => Promise<void> }) {
  const { user } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);

  const [fullName, setFullName] = useState(user?.full_name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [bio, setBio] = useState(user?.bio ?? "");
  const [language, setLanguage] = useState(user?.language ?? "uz");
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const pickAvatar = (file: File | undefined) => {
    if (!file) return;
    setAvatarPreview(URL.createObjectURL(file));
  };

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    setError("");

    try {
      const form = new FormData();
      form.append("full_name", fullName);
      form.append("email", email);
      form.append("bio", bio);
      form.append("language", language);

      const file = fileRef.current?.files?.[0];
      if (file) form.append("avatar", file);

      await api.updateMe(form);
      await onSaved();
      setMessage("Saqlandi");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Saqlanmadi");
    } finally {
      setBusy(false);
    }
  };

  if (!user) return null;

  return (
    <form
      onSubmit={save}
      className="space-y-6 rounded-[var(--radius-card)] border bg-[var(--surface)] p-6"
    >
      <div>
        <h2 className="text-xl font-bold">Ma&apos;lumotlarim</h2>
        <p className="mt-1 text-sm text-ink-600 dark:text-ink-400">
          Faqat kerakli narsalarni so&apos;raymiz — imkon qadar qisqa.
        </p>
      </div>

      {/* avatar */}
      <div className="flex items-center gap-4">
        <div className="relative size-16 shrink-0 overflow-hidden rounded-2xl bg-ink-100 dark:bg-ink-800">
          {avatarPreview || user.avatar ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={avatarPreview ?? user.avatar ?? ""}
              alt=""
              className="size-full object-cover"
            />
          ) : (
            <span className="grid size-full place-items-center font-display text-xl font-extrabold text-ink-400">
              {initialOf(user.full_name, user.phone)}
            </span>
          )}
        </div>
        <div>
          <label
            htmlFor="avatar"
            className="inline-block cursor-pointer rounded-full bg-ink-900 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-ink-700 dark:bg-ink-100 dark:text-ink-950 dark:hover:bg-white"
          >
            Rasm tanlash
          </label>
          <input
            id="avatar"
            ref={fileRef}
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={(e) => pickAvatar(e.target.files?.[0])}
          />
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <Input
          id="full-name"
          label="To'liq ism"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="Ism Familiya"
        />

        <div>
          <span className="mb-2 block text-sm font-semibold">Telefon raqami</span>
          <div className="flex h-13 items-center justify-between gap-2 rounded-2xl border-2 border-[var(--line)] bg-ink-50 px-4 dark:bg-ink-900">
            <span className="text-[16px]">{user.phone}</span>
            {user.is_phone_verified && (
              <span className="text-[12px] font-semibold whitespace-nowrap text-emerald-600">
                Tasdiqlangan
              </span>
            )}
          </div>
        </div>

        <Input
          id="email"
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="email@masalan.com"
          hint="Ixtiyoriy"
        />

        <Select
          id="language"
          label="Til"
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
        >
          <option value="uz">O&apos;zbekcha</option>
          <option value="ru">Русский</option>
          <option value="en">English</option>
        </Select>
      </div>

      <Textarea
        id="bio"
        label="O'zingiz haqingizda"
        value={bio}
        onChange={(e) => setBio(e.target.value)}
        maxLength={500}
        placeholder="Qisqacha yozing… (ixtiyoriy)"
      />

      <div className="flex flex-wrap items-center gap-4">
        <Button disabled={busy}>{busy ? "Saqlanmoqda…" : "Saqlash"}</Button>
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
  );
}

/* ------------------------------------------------------------- do'kon ochish */

function ShopApplication() {
  const [crafts, setCrafts] = useState<ApiCraft[]>([]);
  const [existing, setExisting] = useState<ApiApplication | null>(null);
  const [checking, setChecking] = useState(true);

  const [shopName, setShopName] = useState("");
  const [craft, setCraft] = useState("");
  const [description, setDescription] = useState("");
  const [region, setRegion] = useState("");
  const docRef = useRef<HTMLInputElement>(null);

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  useEffect(() => {
    Promise.all([
      api.crafts().catch(() => [] as ApiCraft[]),
      api.myApplications().catch(() => ({ results: [] as ApiApplication[] })),
    ])
      .then(([craftList, applications]) => {
        setCrafts(craftList);
        setExisting(applications.results[0] ?? null);
      })
      .finally(() => setChecking(false));
  }, []);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");

    if (!shopName.trim() || !craft || !description.trim()) {
      setError("Do'kon nomi, hunar turi va tavsif majburiy");
      return;
    }

    setBusy(true);
    try {
      const form = new FormData();
      form.append("shop_name", shopName);
      form.append("craft", craft);
      form.append("description", description);
      form.append("region", region);

      const file = docRef.current?.files?.[0];
      if (file) form.append("document", file);

      const created = await api.applyShop(form);
      setExisting(created);
      setSent(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Ariza yuborilmadi");
    } finally {
      setBusy(false);
    }
  };

  if (checking) return null;

  if (existing || sent) {
    const status = existing?.status ?? "pending";
    const labels = {
      pending: { tone: "gold" as const, text: "Ko'rib chiqilmoqda" },
      approved: { tone: "brand" as const, text: "Tasdiqlangan" },
      rejected: { tone: "neutral" as const, text: "Rad etilgan" },
    };
    const label = labels[status];

    return (
      <div className="rounded-[var(--radius-card)] border bg-[var(--surface)] p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h2 className="text-xl font-bold">Do&apos;kon ochish arizasi</h2>
          <Badge tone={label.tone}>{label.text}</Badge>
        </div>

        <p className="mt-4 text-ink-700 dark:text-ink-300">
          {status === "pending" &&
            "Arizangiz yuborildi. Admin ko'rib chiqqach SMS orqali xabar beramiz."}
          {status === "approved" &&
            "Tabriklaymiz! Endi mahsulot va post qo'sha olasiz. Sahifani yangilang."}
          {status === "rejected" &&
            (existing?.admin_note || "Ariza rad etildi. Qaytadan yuborishingiz mumkin.")}
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={submit}
      className="space-y-5 rounded-[var(--radius-card)] border-2 border-dashed p-6"
    >
      <div>
        <h2 className="text-xl font-bold">Do&apos;kon ochish</h2>
        <p className="mt-2 text-ink-600 dark:text-ink-400">
          Hunarmand bo&apos;lsangiz — ariza to&apos;ldiring. Admin tasdiqlagach akkauntingiz
          sotuvchiga aylanadi va o&apos;z ishlaringizni qo&apos;ya olasiz.
        </p>
      </div>

      <Input
        id="shop-name"
        label="Do'kon nomi"
        value={shopName}
        onChange={(e) => setShopName(e.target.value)}
        placeholder="Masalan: Rishton kulollari"
      />

      <Select id="craft" label="Hunar turi" value={craft} onChange={(e) => setCraft(e.target.value)}>
        <option value="">Tanlang…</option>
        {crafts.map((c) => (
          <option key={c.id} value={c.id}>
            {c.icon} {c.name}
          </option>
        ))}
      </Select>

      <Textarea
        id="description"
        label="Nima ishlab chiqarasiz"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Hunaringiz va ishlaringiz haqida yozing…"
      />

      <Input
        id="region"
        label="Viloyat"
        value={region}
        onChange={(e) => setRegion(e.target.value)}
        placeholder="Toshkent"
      />

      <div>
        <label htmlFor="document" className="mb-2 block text-sm font-semibold">
          Hujjat <span className="font-normal text-ink-600 dark:text-ink-400">(ixtiyoriy)</span>
        </label>
        <input
          id="document"
          ref={docRef}
          type="file"
          className="w-full text-sm file:mr-4 file:cursor-pointer file:rounded-full file:border-0 file:bg-ink-900 file:px-5 file:py-2.5 file:text-sm file:font-semibold file:text-white dark:file:bg-ink-100 dark:file:text-ink-950"
        />
      </div>

      {error && (
        <p role="alert" className="text-sm font-medium text-brand-600">
          {error}
        </p>
      )}

      <Button size="lg" disabled={busy}>
        {busy ? "Yuborilmoqda…" : "Arizani yuborish"}
      </Button>
    </form>
  );
}
