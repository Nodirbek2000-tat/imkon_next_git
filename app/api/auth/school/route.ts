import { NextRequest, NextResponse } from "next/server";
import { loginPassthrough } from "@/lib/server/djangoAuth";

/**
 * Maktab logini.
 *
 * `loginPassthrough` tokenlarni httpOnly cookie'ga yozib, javobdan olib
 * tashlaydi — xom JWT brauzerga yetib bormaydi. Qolgan login yo'llari
 * (`password`, `google`, `telegram/verify`) bilan bir xil qolip.
 */
export async function POST(request: NextRequest) {
  const body = await request.json();
  const result = await loginPassthrough("/api/auth/school/", body);
  return NextResponse.json(result.data, { status: result.status });
}
