/**
 * Umumiy proxy — brauzerdan kelgan har qanday `/api/*` so'rovni Djangoga
 * server-serverga (CORS'siz) yuboradi, `imkon_access` cookie'dan
 * `Authorization: Bearer` sarlavhasini biriktiradi.
 *
 * Login/logout kabi cookie YOZADIGAN yo'llar (`otp/verify`, `google`,
 * `telegram/verify`, `logout`) o'zining alohida `route.ts`siga ega —
 * Next'ning fayl-marshrutlashida aniq yo'l har doim shu catch-all'dan
 * ustun turadi, shuning uchun ular avtomatik "soyalab" qo'yadi.
 */

import { NextRequest, NextResponse } from "next/server";
import {
  DJANGO_API_URL,
  getAccessCookie,
  refreshAccessToken,
  setAuthCookies,
} from "@/lib/server/djangoAuth";

/** Gavdasiz javob statuslari — HTTP spetsifikatsiyasi bo'yicha. */
const NULL_BODY_STATUSES = new Set([204, 205, 304]);

async function forward(
  request: NextRequest,
  url: string,
  access: string | null,
  body: ArrayBuffer | null,
) {
  const headers = new Headers();
  const contentType = request.headers.get("content-type");
  if (contentType) headers.set("content-type", contentType);
  if (access) headers.set("authorization", `Bearer ${access}`);

  const init: RequestInit = { method: request.method, headers };
  // Streamlab uzatish (`body: request.body` + `duplex: "half"`) Next'ning
  // dev serverida (Turbopack) ishonchsiz chiqdi — Django bo'sh gavda oldi.
  // Kichik hajmli so'rovlar (JSON, forma, rasm yuklash) uchun butunlay
  // buferlash yetarli va ishonchli.
  if (body && body.byteLength > 0) init.body = body;
  return fetch(url, init);
}

async function proxy(request: NextRequest): Promise<NextResponse> {
  // Django'ning o'z urls.py'si ham `/api/...` bilan boshlanadi (masalan
  // `/api/auth/me/`) — Next'ning `/api/*` bilan bir xil, shuning uchun
  // prefiksni OLIB TASHLAMAYMIZ, aynan shu holicha uzatamiz.
  //
  // `trailingSlash: false` (default) tufayli Next oxiridagi `/`ni ushbu
  // handler ishga tushishidan OLDIN 308 bilan olib tashlaydi — lekin
  // Django (`APPEND_SLASH`) doim `/` bilan tugagan yo'lni kutadi. Shuning
  // uchun Djangoga uzatishdan oldin qayta qo'shib qo'yamiz.
  let path = request.nextUrl.pathname;
  if (!path.endsWith("/")) path += "/";

  const url = `${DJANGO_API_URL}${path}${request.nextUrl.search}`;
  const requestBody = request.body ? await request.arrayBuffer() : null;

  const access = await getAccessCookie();
  let response = await forward(request, url, access, requestBody);
  let refreshed: { access: string; refresh: string } | null = null;

  if (response.status === 401 && access) {
    refreshed = await refreshAccessToken();
    if (refreshed) response = await forward(request, url, refreshed.access, requestBody);
  }

  const body = await response.arrayBuffer();
  if (refreshed) await setAuthCookies(refreshed.access, refreshed.refresh);

  // 204/205/304 da gavda BO'LMASLIGI shart — `Response` konstruktori aks
  // holda xato tashlaydi va proxy 500 qaytaradi. DELETE aynan 204 qaytaradi:
  // Django yozuvni o'chirib bo'lgan, lekin brauzer xato ko'radi va interfeys
  // o'chirilgan narsani ko'rsatib turaveradi.
  if (NULL_BODY_STATUSES.has(response.status)) {
    return new NextResponse(null, { status: response.status });
  }

  return new NextResponse(body, {
    status: response.status,
    headers: { "content-type": response.headers.get("content-type") ?? "application/json" },
  });
}

export const GET = proxy;
export const POST = proxy;
export const PATCH = proxy;
export const PUT = proxy;
export const DELETE = proxy;
