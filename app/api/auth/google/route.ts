import { NextRequest, NextResponse } from "next/server";
import { loginPassthrough } from "@/lib/server/djangoAuth";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const result = await loginPassthrough("/api/auth/google/", body);
  return NextResponse.json(result.data, { status: result.status });
}
