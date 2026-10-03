import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * 150000 -> "150 000"
 *
 * Intl.NumberFormat / toLocaleString ishlatilmaydi: Node va brauzer "uz-UZ"
 * uchun har xil ajratgich qaytaradi (`420,000` vs `420 000`) — bu SSR'da
 * hydration mismatch beradi. Qo'lda guruhlash ikkala muhitda ham bir xil.
 */
export function formatNumber(value: number) {
  return Math.round(value)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}

/** 150000 -> "150 000 so'm" */
export function formatPrice(value: number) {
  return `${formatNumber(value)} so'm`;
}

/** Auksion qolgan vaqti. Tugagan bo'lsa null. */
export function timeLeft(endAt: Date) {
  const ms = endAt.getTime() - Date.now();
  if (ms <= 0) return null;

  return {
    days: Math.floor(ms / 86_400_000),
    hours: Math.floor((ms / 3_600_000) % 24),
    minutes: Math.floor((ms / 60_000) % 60),
    seconds: Math.floor((ms / 1000) % 60),
    total: ms,
  };
}

export const pad = (n: number) => String(n).padStart(2, "0");

/**
 * "hozirgina" / "3 daqiqa oldin" / "2 soat oldin"
 *
 * Auksionda taklif qachon kelgani muhim — "12:47" emas, "1 daqiqa oldin"
 * jonli harakat borligini ko'rsatadi.
 */
export function timeAgo(iso: string) {
  const seconds = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);

  if (seconds < 45) return "hozirgina";
  if (seconds < 3600) return `${Math.floor(seconds / 60)} daqiqa oldin`;
  if (seconds < 86_400) return `${Math.floor(seconds / 3600)} soat oldin`;
  return `${Math.floor(seconds / 86_400)} kun oldin`;
}

/** "2026-08-04T12:30:00Z" -> "4-avgust, 12:30" */
const MONTHS = [
  "yanvar", "fevral", "mart", "aprel", "may", "iyun",
  "iyul", "avgust", "sentabr", "oktabr", "noyabr", "dekabr",
];

export function formatDate(iso: string, withTime = false) {
  const date = new Date(iso);
  const base = `${date.getDate()}-${MONTHS[date.getMonth()]}`;
  if (!withTime) return base;
  return `${base}, ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/**
 * Avatar o'rnida ko'rinadigan harf.
 *
 * Maktab va o'quvchi akkauntida telefon raqami YO'Q (`null`) — shuning
 * uchun "ism bo'lmasa raqamdan ol" degan eski mantiq ularda yiqilardi.
 * `+998` prefiksi tashlab yuboriladi: aks holda hamma raqamli akkaunt
 * bir xil "+" harfi bilan ko'rinardi.
 */
export function initialOf(name?: string | null, fallback?: string | null) {
  const source = (name || fallback || "").replace(/^\+998/, "").trim();
  return (source[0] ?? "?").toUpperCase();
}

/**
 * Maktab loginini tozalaydi.
 *
 * Backend qoidasi: ^[a-z0-9][a-z0-9-]{2,39}$ — kichik lotin harflari,
 * raqam va chiziqcha.
 *
 * MUHIM: bu funksiya IKKI joyda ishlatiladi — admin loginni yaratganda
 * va maktab uni kirish sahifasida yozganda. Qoida ikkalasida bir xil
 * bo'lishi SHART: biri bo'sh joyni chiziqchaga, ikkinchisi hech narsaga
 * aylantirsa, bitta qog'ozdagi login ikki joyda boshqacha chiqadi va
 * maktab "parol xato" degan xabarni ko'rib, parolini qayta-qayta
 * yozib ovora bo'ladi.
 */
export function normalizeSchoolLogin(raw: string) {
  return raw
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .slice(0, 40);
}

/** Login backend qoidasiga mos keladimi. */
export const SCHOOL_LOGIN_RE = /^[a-z0-9][a-z0-9-]{2,39}$/;
