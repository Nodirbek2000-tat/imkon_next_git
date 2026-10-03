"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { Input, Textarea, Select } from "@/components/ui/Input";
import { Skeleton } from "@/components/ui/Skeleton";
import { useAuth } from "@/components/auth/AuthProvider";
import {
  api,
  ApiError,
  type ApiCategory,
  type ApiProductDetail,
  type ApiStudent,
} from "@/lib/api";
import { cn, formatPrice, initialOf } from "@/lib/utils";

type Feature = { name: string; value: string };

const MAX_IMAGES = 10;

/** Eng kichik narx. Tekshiruv JS'da — brauzerning o'z tilidagi xabari chiqmasin. */
const MIN_PRICE = 1000;

/** Select'da ham, pastdagi umumiy xato satrida ham bir xil matn chiqsin. */
const STUDENT_REQUIRED = "O'quvchini tanlang";

/**
 * Mahsulot formasi — yaratish va tahrirlash uchun bitta komponent.
 *
 * `initialProduct` berilsa — tahrirlash rejimi: maydonlar to'ldirilgan
 * holda ochiladi, mavjud rasmlar faqat ko'rsatiladi (alohida o'chirib
 * bo'lmaydi — backend rasmlarni "hammasi yoki hech narsa" almashtiradi:
 * yangi rasm yuborilsa eskilar BUTUNLAY almashadi, yuborilmasa tegilmaydi).
 *
 * Maktab akkauntida forma tepasida "O'quvchi" bo'limi paydo bo'ladi: ish
 * tanlangan bola nomidan qo'yiladi. `initialStudent` — maktab panelidagi
 * o'quvchi kartasidan kelgan slug, shu bola oldindan tanlangan bo'ladi.
 */
export function ProductForm({
  initialProduct,
  initialStudent,
}: {
  initialProduct?: ApiProductDetail;
  initialStudent?: string;
}) {
  const router = useRouter();
  const { user } = useAuth();
  const isEdit = !!initialProduct;
  const isSchool = !!user?.is_school;

  const [categories, setCategories] = useState<ApiCategory[]>([]);
  // Tahrirlash sahifasi mahsulotni `lang=uz` bilan yuklaydi — shuning uchun
  // `title`/`description` bu yerda asl o'zbekcha matn. Ru/en tarjimalar
  // bo'sh qoldiriladi: bo'sh maydon PATCH'da yuborilmaydi, mavjud
  // tarjimalar backend'da tegilmay qoladi.
  const [title, setTitle] = useState(initialProduct?.title ?? "");
  const [titleRu, setTitleRu] = useState("");
  const [titleEn, setTitleEn] = useState("");
  const [description, setDescription] = useState(initialProduct?.description ?? "");
  const [descriptionRu, setDescriptionRu] = useState("");
  const [descriptionEn, setDescriptionEn] = useState("");
  const [category, setCategory] = useState(
    initialProduct ? String(initialProduct.category.id) : "",
  );
  const [price, setPrice] = useState(
    initialProduct ? String(Math.round(Number(initialProduct.price))) : "",
  );
  const [stock, setStock] = useState(initialProduct ? String(initialProduct.stock) : "1");
  const [features, setFeatures] = useState<Feature[]>(
    initialProduct?.features.length
      ? initialProduct.features.map((f) => ({ name: f.name, value: f.value }))
      : [{ name: "", value: "" }],
  );

  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  // `null` — hali yuklanmoqda. Hunarmand akkauntida umuman yuklanmaydi.
  const [students, setStudents] = useState<ApiStudent[] | null>(null);
  const [studentsError, setStudentsError] = useState("");
  const [studentSlug, setStudentSlug] = useState("");

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [showTranslations, setShowTranslations] = useState(false);

  // Tahrirlashda mahsulot egasi — o'quvchining slug'i
  const ownerSlug = initialProduct?.artisan.slug;

  useEffect(() => {
    api.categories().then(setCategories).catch(() => setCategories([]));
  }, []);

  useEffect(() => {
    if (!isSchool) return;
    let alive = true;

    api
      .mySchoolStudents()
      .then((list) => {
        if (!alive) return;
        setStudents(list);

        // Yashirilgan bolaga yangi ish qo'shilmaydi, lekin tahrirlashda
        // joriy ega ro'yxatda qolishi kerak — aks holda Select boshqa
        // bolani ko'rsatib qolardi.
        const pickable = list.filter((s) => s.is_active || s.slug === ownerSlug);
        const preferred = ownerSlug ?? initialStudent ?? "";

        if (pickable.some((s) => s.slug === preferred)) setStudentSlug(preferred);
        // Bitta o'quvchi bo'lsa tanlashga hojat yo'q
        else if (!ownerSlug && pickable.length === 1) setStudentSlug(pickable[0].slug);
      })
      .catch((err) => {
        if (!alive) return;
        setStudents([]);
        setStudentsError(
          err instanceof ApiError ? err.message : "O'quvchilar ro'yxati yuklanmadi",
        );
      });

    return () => {
      alive = false;
    };
  }, [isSchool, ownerSlug, initialStudent]);

  const pickable = students?.filter((s) => s.is_active || s.slug === ownerSlug) ?? [];
  const selectedStudent = pickable.find((s) => s.slug === studentSlug) ?? null;

  // Tahrirlashda mahsulot shu maktabning o'quvchisiga tegishli bo'lmasa
  // (masalan admin boshqa ishni ochib qo'ygan) — hech narsa yubormaymiz.
  const schoolOwns = !!students && students.some((s) => s.slug === ownerSlug);
  const studentRequired = isSchool && (!isEdit || schoolOwns);
  const showStudentSection = isSchool && (students === null || studentRequired);
  // Ro'yxat yuklanmagan bo'lsa bu holat hisoblanmaydi — sabab boshqa va
  // o'rnida yuklash xatosi ko'rinishi kerak.
  const noStudents =
    studentRequired && students !== null && !studentsError && pickable.length === 0;
  // Bolalari bor, lekin hammasi yashirilgan. Bunda "o'quvchi qo'shing"
  // deyilsa o'qituvchi borlarini yana qaytadan kiritib yuboradi.
  const allHidden = noStudents && (students?.length ?? 0) > 0;
  // Ro'yxat yuklanmasa o'quvchini tanlab bo'lmaydi — ish ham qo'shilmaydi.
  // (Tahrirlashda `student` yuborilmaydi, shuning uchun u to'sqinlik emas.)
  const cannotSave = studentRequired && !!studentsError;

  // Ko'rib chiqish uchun yaratilgan blob URL'larni bo'shatamiz — xotira oqmasin
  useEffect(() => {
    return () => previews.forEach((url) => URL.revokeObjectURL(url));
  }, [previews]);

  const addFiles = (incoming: FileList | null) => {
    if (!incoming) return;
    const next = [...files, ...Array.from(incoming)].slice(0, MAX_IMAGES);
    setFiles(next);
    setPreviews((old) => {
      old.forEach((url) => URL.revokeObjectURL(url));
      return next.map((file) => URL.createObjectURL(file));
    });
  };

  const removeFile = (index: number) => {
    const next = files.filter((_, i) => i !== index);
    setFiles(next);
    setPreviews((old) => {
      old.forEach((url) => URL.revokeObjectURL(url));
      return next.map((file) => URL.createObjectURL(file));
    });
  };

  const updateFeature = (index: number, patch: Partial<Feature>) => {
    setFeatures((list) => list.map((f, i) => (i === index ? { ...f, ...patch } : f)));
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");

    if (studentRequired && !studentSlug) return setError(STUDENT_REQUIRED);
    if (!title.trim()) return setError("Mahsulot nomini kiriting");
    if (!category) return setError("Kategoriyani tanlang");

    // Narx va zaxira tekshiruvi shu yerda: `min`/`step` atributlariga
    // qoldirilsa brauzer o'z tilida ("Please enter a valid value…")
    // ogohlantiradi — o'zbekcha interfeysda bu tushunarsiz.
    const priceNumber = Number(price);
    if (!price.trim() || !Number.isFinite(priceNumber))
      return setError("Narxni kiriting");
    if (priceNumber < MIN_PRICE)
      return setError(`Narx kamida ${formatPrice(MIN_PRICE)} bo'lsin`);

    const stockNumber = Number(stock || "1");
    if (!Number.isInteger(stockNumber) || stockNumber < 1)
      return setError("Nechta borligini butun son bilan kiriting — kamida 1 ta");

    if (!isEdit && files.length === 0) return setError("Kamida bitta rasm yuklang");

    setBusy(true);
    try {
      const form = new FormData();
      // Hunarmand o'z nomidan qo'yadi — bu maydon faqat maktabda yuboriladi
      if (studentRequired) form.append("student", studentSlug);
      form.append("title_uz", title);
      if (titleRu) form.append("title_ru", titleRu);
      if (titleEn) form.append("title_en", titleEn);
      form.append("description_uz", description);
      if (descriptionRu) form.append("description_ru", descriptionRu);
      if (descriptionEn) form.append("description_en", descriptionEn);
      form.append("category", category);
      form.append("price", price);
      form.append("stock", stock || "1");
      if (!isEdit) form.append("status", "active");

      // Tahrirlashda: rasm tanlanmagan bo'lsa `images` umuman yuborilmaydi —
      // backend mavjud rasmlarni tegmaydi. Tanlansa — to'liq almashadi.
      files.forEach((file) => form.append("images", file));

      const cleanFeatures = features.filter((f) => f.name.trim() && f.value.trim());
      form.append("features", JSON.stringify(cleanFeatures));

      const saved = isEdit
        ? await api.updateProduct(initialProduct.slug, form)
        : await api.createProduct(form);
      router.push(`/mahsulot/${saved.slug}`);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : isEdit
            ? "Saqlanmadi"
            : "Mahsulot qo'shilmadi",
      );
      setBusy(false);
    }
  };

  // Tanlasa bo'ladigan o'quvchi yo'q — formani umuman ko'rsatmaymiz.
  // Avval butun forma to'ldirilib, pastdagi tugma sababsiz o'chiq
  // turardi: o'qituvchi bekorga mehnat qilib, nega bosilmasligini
  // tushunmasdi.
  if (noStudents)
    return (
      <Container className="py-12">
        <div className="mx-auto max-w-2xl rounded-[var(--radius-card)] border-2 border-brand-600 bg-[var(--surface)] p-8 text-center">
          <h2 className="text-xl font-bold">
            {allHidden
              ? "O'quvchilaringiz hozir yashirilgan"
              : "Hali o'quvchi qo'shilmagan"}
          </h2>
          <p className="mt-3 text-[15px] leading-relaxed text-ink-600 dark:text-ink-400">
            {allHidden ? (
              <>
                Hamma o&apos;quvchilaringiz yashirilgan, yashirilgan o&apos;quvchi
                nomidan esa yangi ish qo&apos;yib bo&apos;lmaydi. Maktab
                panelidagi o&apos;quvchilar ro&apos;yxatiga kirib, kerakli
                bolani qaytarib ko&apos;rsating — shundan keyin shu formaga
                qaytasiz.
              </>
            ) : (
              <>
                Ish o&apos;quvchi nomidan sotuvga qo&apos;yiladi. Avval
                o&apos;quvchi qo&apos;shing — keyin uning nomidan ish
                qo&apos;yasiz.
              </>
            )}
          </p>
          <Button href="/profil" size="lg" className="mt-6">
            {allHidden ? "O'quvchilar ro'yxati" : "O'quvchi qo'shish"}
          </Button>
        </div>
      </Container>
    );

  return (
    <Container className="py-12">
      {/* `noValidate` — tekshiruvni o'zimiz qilamiz, brauzerning o'z tilidagi
          xabarlari o'zbekcha interfeysga tushmasin */}
      <form onSubmit={submit} noValidate className="mx-auto max-w-2xl space-y-8">
        {/* O'quvchi — maktab uchun eng birinchi savol, shuning uchun tepada */}
        {showStudentSection && (
          <section className="rounded-[var(--radius-card)] border-2 border-brand-600 bg-[var(--surface)] p-6">
            <h2 className="text-xl font-bold">Ishni kim qildi?</h2>
            <p className="mt-1 text-[14px] text-ink-600 dark:text-ink-400">
              Mahsulot tanlagan o&apos;quvchingiz nomidan sotuvga qo&apos;yiladi.
            </p>

            {students === null ? (
              <Skeleton className="mt-5 h-13 w-full rounded-2xl" />
            ) : studentsError ? (
              <div role="alert" className="mt-5">
                <p className="text-[14px] font-medium text-brand-600">{studentsError}</p>
                <p className="mt-1 text-[14px] text-ink-600 dark:text-ink-400">
                  Sahifani yangilab ko&apos;ring.
                </p>
              </div>
            ) : (
              <div className="mt-5 space-y-4">
                <Select
                  id="student"
                  label="O'quvchi"
                  value={studentSlug}
                  onChange={(e) => {
                    setStudentSlug(e.target.value);
                    // Tanlangach qizil ramka va "O'quvchini tanlang" yozuvi
                    // qolib ketmasin — foydalanuvchi xato bor deb o'ylaydi
                    if (error === STUDENT_REQUIRED) setError("");
                  }}
                  error={error === STUDENT_REQUIRED ? STUDENT_REQUIRED : undefined}
                >
                  <option value="">Tanlang…</option>
                  {pickable.map((s) => (
                    <option key={s.slug} value={s.slug}>
                      {s.student_grade ? `${s.full_name} (${s.student_grade})` : s.full_name}
                    </option>
                  ))}
                </Select>

                {selectedStudent && (
                  <div className="flex items-center gap-4 rounded-2xl bg-brand-50 p-4 dark:bg-brand-950">
                    {selectedStudent.avatar ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={selectedStudent.avatar}
                        alt=""
                        className="size-12 shrink-0 rounded-full object-cover"
                      />
                    ) : (
                      <span className="grid size-12 shrink-0 place-items-center rounded-full bg-brand-600 text-lg font-bold text-white">
                        {initialOf(selectedStudent.full_name)}
                      </span>
                    )}
                    <p className="text-[14px] text-brand-700 dark:text-brand-300">
                      Bu ish <strong>{selectedStudent.full_name}</strong> nomidan
                      qo&apos;yiladi. Sotilsa, puli maktab hisobiga tushadi.
                    </p>
                  </div>
                )}
              </div>
            )}
          </section>
        )}

        {/* Rasmlar */}
        <section className="rounded-[var(--radius-card)] border bg-[var(--surface)] p-6">
          <h2 className="text-xl font-bold">Rasmlar</h2>
          <p className="mt-1 text-[14px] text-ink-600 dark:text-ink-400">
            {isEdit
              ? "Yangi rasm tanlasangiz, hozirgi rasmlar TO'LIQ almashadi. Tanlamasangiz — o'zgarishsiz qoladi."
              : `1–${MAX_IMAGES} ta rasm. Birinchisi asosiy bo'ladi.`}
          </p>

          {isEdit && files.length === 0 && initialProduct.images.length > 0 && (
            <div className="mt-5 grid grid-cols-3 gap-3 sm:grid-cols-4">
              {initialProduct.images.map((img) => (
                <div key={img.id} className="relative aspect-square overflow-hidden rounded-2xl border">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img.image} alt={img.alt_text} className="size-full object-cover" />
                  {img.is_main && (
                    <span className="absolute top-2 left-2 rounded-full bg-brand-600 px-2 py-0.5 text-[10px] font-bold text-white">
                      Asosiy
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}

          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => addFiles(e.target.files)}
            className="sr-only"
            id="images"
          />

          <div className="mt-5 grid grid-cols-3 gap-3 sm:grid-cols-4">
            {previews.map((url, i) => (
              <div
                key={url}
                className="group relative aspect-square overflow-hidden rounded-2xl border"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt="" className="size-full object-cover" />

                {i === 0 && (
                  <span className="absolute top-2 left-2 rounded-full bg-brand-600 px-2 py-0.5 text-[10px] font-bold text-white">
                    Asosiy
                  </span>
                )}

                <button
                  type="button"
                  onClick={() => removeFile(i)}
                  aria-label={`${i + 1}-rasmni o'chirish`}
                  className="absolute top-2 right-2 grid size-7 place-items-center rounded-full bg-ink-950/70 text-white opacity-0 transition-opacity duration-300 group-hover:opacity-100 focus-visible:opacity-100"
                >
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                    <path d="M2 2l8 8M10 2l-8 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </button>
              </div>
            ))}

            {files.length < MAX_IMAGES && (
              <label
                htmlFor="images"
                className={cn(
                  "grid aspect-square cursor-pointer place-items-center rounded-2xl border-2 border-dashed",
                  "text-ink-600 transition-colors duration-300 hover:border-brand-600 hover:text-brand-600 dark:text-ink-400",
                )}
              >
                <span className="text-center">
                  <span className="block text-2xl">+</span>
                  <span className="block text-[11px] font-semibold">
                    {isEdit ? "Almashtirish" : "Rasm"}
                  </span>
                </span>
              </label>
            )}
          </div>
        </section>

        {/* Asosiy ma'lumot */}
        <section className="space-y-5 rounded-[var(--radius-card)] border bg-[var(--surface)] p-6">
          <h2 className="text-xl font-bold">Mahsulot haqida</h2>

          <Input
            id="title"
            label="Nomi"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Masalan: Sopol choynak"
          />

          <button
            type="button"
            onClick={() => setShowTranslations((v) => !v)}
            className="text-sm font-medium text-brand-600 hover:underline"
          >
            {showTranslations ? "− Tarjimalarni yashirish" : "+ Rus/ingliz tarjimasi"}
          </button>

          {showTranslations && (
            <div className="space-y-5 rounded-2xl bg-[var(--bg)] p-5">
              <Input
                id="title-ru"
                label="Nomi (ruscha)"
                value={titleRu}
                onChange={(e) => setTitleRu(e.target.value)}
                placeholder="Керамический чайник"
              />
              <Input
                id="title-en"
                label="Nomi (inglizcha)"
                value={titleEn}
                onChange={(e) => setTitleEn(e.target.value)}
                placeholder="Ceramic teapot"
              />
            </div>
          )}

          <Textarea
            id="description"
            label="Tavsif"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Qanday yasalgan, qanday material ishlatilgan…"
          />

          {showTranslations && (
            <div className="space-y-5 rounded-2xl bg-[var(--bg)] p-5">
              <Textarea
                id="description-ru"
                label="Tavsif (ruscha)"
                value={descriptionRu}
                onChange={(e) => setDescriptionRu(e.target.value)}
                placeholder="Как сделано, какой материал использован…"
              />
              <Textarea
                id="description-en"
                label="Tavsif (inglizcha)"
                value={descriptionEn}
                onChange={(e) => setDescriptionEn(e.target.value)}
                placeholder="How it's made, what material was used…"
              />
            </div>
          )}

          <Select
            id="category"
            label="Kategoriya"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option value="">Tanlang…</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </section>

        {/* Xususiyatlar */}
        <section className="rounded-[var(--radius-card)] border bg-[var(--surface)] p-6">
          <h2 className="text-xl font-bold">Xususiyatlar</h2>
          <p className="mt-1 text-[14px] text-ink-600 dark:text-ink-400">
            Material, o&apos;lcham, rang — xaridor bilishi kerak bo&apos;lgan narsalar.
          </p>

          <ul className="mt-5 space-y-3">
            {features.map((feature, i) => (
              <li key={i} className="flex gap-3">
                <input
                  aria-label={`${i + 1}-xususiyat nomi`}
                  value={feature.name}
                  onChange={(e) => updateFeature(i, { name: e.target.value })}
                  placeholder="Material"
                  className="h-12 w-1/3 rounded-xl border-2 border-[var(--line)] bg-[var(--bg)] px-4 transition-colors outline-none focus:border-brand-600"
                />
                <input
                  aria-label={`${i + 1}-xususiyat qiymati`}
                  value={feature.value}
                  onChange={(e) => updateFeature(i, { value: e.target.value })}
                  placeholder="Yong'och"
                  className="h-12 flex-1 rounded-xl border-2 border-[var(--line)] bg-[var(--bg)] px-4 transition-colors outline-none focus:border-brand-600"
                />
                {features.length > 1 && (
                  <button
                    type="button"
                    onClick={() => setFeatures((l) => l.filter((_, j) => j !== i))}
                    aria-label="O'chirish"
                    className="grid size-12 shrink-0 place-items-center rounded-xl border-2 border-[var(--line)] transition-colors hover:border-brand-600 hover:text-brand-600"
                  >
                    −
                  </button>
                )}
              </li>
            ))}
          </ul>

          {features.length < 10 && (
            <button
              type="button"
              onClick={() => setFeatures((l) => [...l, { name: "", value: "" }])}
              className="mt-4 text-sm font-semibold text-brand-600 hover:underline"
            >
              + Yana qo&apos;shish
            </button>
          )}
        </section>

        {/* Narx */}
        <section className="space-y-5 rounded-[var(--radius-card)] border bg-[var(--surface)] p-6">
          <h2 className="text-xl font-bold">Narx va zaxira</h2>

          <div className="grid gap-5 sm:grid-cols-2">
            <Input
              id="price"
              label="Narx (so'm)"
              type="number"
              inputMode="numeric"
              min={MIN_PRICE}
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="150000"
              hint={
                price && Number.isFinite(Number(price))
                  ? formatPrice(Number(price))
                  : `Kamida ${formatPrice(MIN_PRICE)}`
              }
            />
            <Input
              id="stock"
              label="Nechta bor"
              type="number"
              inputMode="numeric"
              min={1}
              value={stock}
              onChange={(e) => setStock(e.target.value)}
            />
          </div>

        </section>

        {error && (
          <p role="alert" className="text-center font-medium text-brand-600">
            {error}
          </p>
        )}

        {/* Tugma o'chiq bo'lsa sababi yonida turadi: tepadagi xabar telefon
            ekranida ko'rinmay qoladi */}
        {cannotSave && (
          <p className="text-center text-[14px] text-ink-600 dark:text-ink-400">
            O&apos;quvchi tanlanmagani uchun saqlab bo&apos;lmaydi — tepadagi
            xabarga qarang.
          </p>
        )}

        <div className="flex flex-wrap gap-3">
          <Button size="lg" disabled={busy || cannotSave}>
            {busy
              ? "Saqlanmoqda…"
              : isEdit
                ? "O'zgarishlarni saqlash"
                : "Mahsulotni qo'shish"}
          </Button>
          <Button href="/profil" size="lg" variant="outline">
            Bekor qilish
          </Button>
        </div>
      </form>
    </Container>
  );
}
