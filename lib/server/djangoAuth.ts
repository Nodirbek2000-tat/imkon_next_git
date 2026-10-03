/**
 * Server-only yordamchilar — JWT'ni Django bilan Next.js serveri orasida saqlaydi.
 *
 * Brauzer bu tokenlarni HECH QACHON ko'rmaydi: httpOnly cookie'da saqlanadi,
 * faqat Next.js server (Route Handler'lar) o'qiy oladi. Shu bilan XSS orqali
 * token o'g'irlash imkonsiz bo'ladi — client JS cookie qiymatiga umuman
 * kira olmaydi.
 */

import { cookies } from "next/headers";

// Server-only — NEXT_PUBLIC_ prefiksi yo'q, brauzerga hech qachon jo'natilmaydi
export const DJANGO_API_URL = process.env.DJANGO_API_URL ?? "http://localhost:8000";

const ACCESS_COOKIE = "imkon_access";
const REFRESH_COOKIE = "imkon_refresh";

/**
 * Sessiya qancha davom etadi. Kerak bo'lsa `SESSION_DAYS` bilan o'zgartiriladi
 * (server-only — NEXT_PUBLIC_ prefiksi YO'Q, brauzerga chiqmaydi).
 *
 * Diqqat: bu son va backenddagi `REFRESH_TOKEN_LIFETIME_DAYS` — ikki alohida
 * qiymat. Qaysi biri KICHIK bo'lsa, o'sha hal qiladi. 30 kundan uzaytirmoqchi
 * bo'lsangiz, ikkalasini ham oshirish kerak.
 */
const SESSION_DAYS = Number(process.env.SESSION_DAYS ?? 30);
const SESSION_MAX_AGE = 60 * 60 * 24 * SESSION_DAYS;

const baseCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
};

export async function setAuthCookies(access: string, refresh: string) {
  const store = await cookies();
  // IKKALASIGA ham `maxAge` kerak. Avval `access` da u yo'q edi — shuning
  // uchun u "sessiya cookie"si bo'lib, brauzer yopilishi bilan o'chardi va
  // foydalanuvchi har safar qaytadan kirishga majbur bo'lardi.
  store.set(ACCESS_COOKIE, access, { ...baseCookieOptions, maxAge: SESSION_MAX_AGE });
  store.set(REFRESH_COOKIE, refresh, { ...baseCookieOptions, maxAge: SESSION_MAX_AGE });
}

export async function clearAuthCookies() {
  const store = await cookies();
  store.delete(ACCESS_COOKIE);
  store.delete(REFRESH_COOKIE);
}

export async function getAccessCookie(): Promise<string | null> {
  const store = await cookies();
  return store.get(ACCESS_COOKIE)?.value ?? null;
}

export async function getRefreshCookie(): Promise<string | null> {
  const store = await cookies();
  return store.get(REFRESH_COOKIE)?.value ?? null;
}

/**
 * Login endpointlari (otp/verify, google, telegram/verify) uchun umumiy
 * qolip: Djangoga JSON yuboradi, muvaffaqiyatli bo'lsa access/refresh'ni
 * cookie'ga yozadi va ularni javobdan OLIB TASHLAB qaytaradi — xom token
 * brauzerga hech qachon yetib bormaydi. Xato bo'lsa Django javobini
 * o'zgarishsiz uzatadi.
 */
export async function loginPassthrough(djangoPath: string, body: unknown) {
  const response = await fetch(`${DJANGO_API_URL}${djangoPath}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    return { ok: false as const, status: response.status, data };
  }

  const { access, refresh, ...rest } = data;
  await setAuthCookies(access, refresh);
  return { ok: true as const, status: response.status, data: rest };
}

/**
 * Django'ning `token/refresh/` orqali yangi access (va rotatsiya bilan
 * yangi refresh) token oladi. Cookie'larni bu yerda YOZMAYDI — bu faqat
 * qiymatlarni qaytaradi, chaqiruvchi kerak bo'lsa cookie'ga yozadi
 * (Route Handler ichida) yoki shu render uchun ishlatib qo'ya oladi
 * (Server Component ichida — u yerda cookie yozib bo'lmaydi).
 */
export async function refreshAccessToken(): Promise<{ access: string; refresh: string } | null> {
  const refresh = await getRefreshCookie();
  if (!refresh) return null;

  // Bir marta qayta uriniladi. Tarmoq uzilishi yoki backendning vaqtinchalik
  // 5xx javobi tufayli foydalanuvchi tizimdan chiqib qolmasin — bitta sekundlik
  // uzilish 30 kunlik sessiyani buzmasligi kerak.
  //
  // 401 da QAYTA URINILMAYDI: u "refresh token haqiqatan yaroqsiz" degani,
  // takrorlash foydasiz va faqat kutishni uzaytiradi.
  let response: Response | null = null;

  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      response = await fetch(`${DJANGO_API_URL}/api/auth/token/refresh/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh }),
        cache: "no-store",
      });
    } catch {
      response = null; // tarmoq xatosi — qayta urinamiz
    }

    if (response && (response.ok || response.status < 500)) break;
  }

  if (!response || !response.ok) return null;

  const data = await response.json();
  return { access: data.access, refresh: data.refresh ?? refresh };
}
