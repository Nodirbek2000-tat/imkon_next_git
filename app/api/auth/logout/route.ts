import { NextResponse } from "next/server";
import { clearAuthCookies } from "@/lib/server/djangoAuth";

// Django tomonida hech qanday sessiya/blacklist yo'q (token_blacklist
// o'rnatilmagan) — shuning uchun logout faqat Next tarafidagi cookie'larni
// tozalaydi, Djangoga alohida so'rov yubormaydi.
export async function POST() {
  await clearAuthCookies();
  return NextResponse.json({ detail: "Chiqildi." });
}
