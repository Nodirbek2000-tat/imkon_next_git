import { DJANGO_API_URL, getAccessCookie, refreshAccessToken } from "@/lib/server/djangoAuth";
import type { ApiUser } from "@/lib/api";

/**
 * Server Component'lar uchun — joriy foydalanuvchini Djangodan to'g'ridan-to'g'ri
 * (server-serverga, proxy orqali emas) oladi. `/admin` kabi sahifalarni render
 * boshlanishidan OLDIN himoya qilish uchun ishlatiladi (haqiqiy 404).
 *
 * JWT'da `is_staff`/rol claim'i yo'q (token oddiy `RefreshToken.for_user()`
 * bilan yasaladi) — shuning uchun bu yerda tokenni "hal qilib" bo'lmaydi,
 * Djangoning o'zidan so'rash kerak.
 */
export async function getCurrentUser(): Promise<ApiUser | null> {
  const access = await getAccessCookie();
  if (!access) return null;

  let response = await fetchMe(access);

  if (response.status === 401) {
    // Server Component ichida cookie YOZIB bo'lmaydi (Next taqiqlaydi) —
    // shuning uchun yangilangan tokenni faqat shu render uchun ishlatamiz.
    // Cookie'ning o'zi keyingi client so'rovda (BFF proxy orqali) yangilanadi.
    const refreshed = await refreshAccessToken();
    if (!refreshed) return null;
    response = await fetchMe(refreshed.access);
  }

  return response.ok ? response.json() : null;
}

function fetchMe(access: string) {
  return fetch(`${DJANGO_API_URL}/api/auth/me/`, {
    headers: { Authorization: `Bearer ${access}` },
    cache: "no-store",
  });
}
