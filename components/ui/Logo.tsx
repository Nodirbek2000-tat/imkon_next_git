import { cn } from "@/lib/utils";

/**
 * Imkon Plus logotipi.
 *
 * Ikkita fayl bor: yozuvi qora (kunduzgi) va oq (tungi). Bittasini
 * ishlatib CSS bilan rangini o'zgartirib bo'lmaydi — logotipda qora ham,
 * qizil ham bor, `invert` qizilni ham buzardi. Shuning uchun ikkalasi
 * ham qo'yiladi va mavzuga qarab biri ko'rsatiladi.
 *
 * `priority` — sahifaning eng tepasidagi logotip uchun: brauzer uni
 * kechiktirmasdan yuklasin.
 */
export function Logo({
  className,
  priority = false,
}: {
  className?: string;
  priority?: boolean;
}) {
  const common = cn("h-9 w-auto", className);
  const loading = priority ? "eager" : "lazy";

  return (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/brend/logo.png"
        alt="Imkon Plus"
        loading={loading}
        // @ts-expect-error — `fetchPriority` React tiplariga hali kirmagan
        fetchpriority={priority ? "high" : undefined}
        className={cn(common, "dark:hidden")}
      />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/brend/logo-dark.png"
        alt=""
        aria-hidden="true"
        loading={loading}
        className={cn(common, "hidden dark:block")}
      />
    </>
  );
}
