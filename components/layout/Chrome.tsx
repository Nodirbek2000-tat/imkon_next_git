"use client";

import { usePathname } from "next/navigation";

/**
 * Sayt sarlavhasi va pastki qismini yashiradigan o'ram.
 *
 * Taklifnoma kabi sahifalar butun ekranni egallaydi — ularda menyu,
 * savat va footer ortiqcha: havolani ochgan mehmon faqat taklifnomani
 * ko'rishi kerak.
 *
 * Nega shu yo'l: `app/layout.tsx` server komponenti, u `usePathname`
 * ishlata olmaydi. Ichki `layout.tsx` esa ota layout'ni ALMASHTIRMAYDI,
 * ustiga qo'shiladi — ya'ni header baribir chiqaverardi. Shuning uchun
 * header va footer shu kichik klient o'ramiga solinadi.
 */
const BARE_ROUTES = ["/taklifnoma"];

export function Chrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const bare = BARE_ROUTES.some(
    (route) => pathname === route || pathname?.startsWith(`${route}/`),
  );

  return bare ? null : <>{children}</>;
}
