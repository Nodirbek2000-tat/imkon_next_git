import { cn } from "@/lib/utils";
import type { Product } from "@/lib/mock";

/**
 * Mahsulot rasmi.
 *
 * `image` berilsa — haqiqiy rasm (oq fonli mahsulot fotosi). Berilmasa
 * abstrakt gradient chiziladi: bu "buzilgan rasm" emas, atayin qilingan
 * bezak, shuning uchun bitta rasm yetishmasa ham bo'lim butun ko'rinadi.
 */
export function Artwork({
  art,
  image,
  alt = "",
  className,
}: {
  art: Product["art"];
  image?: string;
  alt?: string;
  className?: string;
}) {
  const id = `${art.shape}-${art.from.slice(1)}-${art.to.slice(1)}`;

  if (image) {
    return (
      <div className={cn("relative overflow-hidden bg-white", className)}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={image}
          alt={alt}
          loading="lazy"
          className="size-full object-cover transition-transform duration-[900ms] [transition-timing-function:var(--ease-out-soft)] group-hover:scale-[1.06]"
        />
      </div>
    );
  }

  return (
    <div className={cn("relative overflow-hidden bg-ink-100 dark:bg-ink-900", className)}>
      <svg
        viewBox="0 0 400 400"
        className="size-full transition-transform duration-[900ms] [transition-timing-function:var(--ease-out-soft)] group-hover:scale-[1.08]"
        preserveAspectRatio="xMidYMid slice"
        role="presentation"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id={`g-${id}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={art.from} />
            <stop offset="100%" stopColor={art.to} />
          </linearGradient>
        </defs>

        <rect width="400" height="400" fill={`url(#g-${id})`} />

        {art.shape === "arc" && (
          <g fill="none" stroke="white" strokeOpacity="0.28" strokeWidth="14">
            <circle cx="200" cy="300" r="70" />
            <circle cx="200" cy="300" r="130" />
            <circle cx="200" cy="300" r="190" />
          </g>
        )}

        {art.shape === "grid" && (
          <g fill="white" fillOpacity="0.2">
            {Array.from({ length: 5 }).map((_, r) =>
              Array.from({ length: 5 }).map((_, c) => (
                <rect
                  key={`${r}-${c}`}
                  x={40 + c * 70}
                  y={40 + r * 70}
                  width={((r + c) % 3) * 12 + 16}
                  height={((r + c) % 3) * 12 + 16}
                  rx="4"
                />
              )),
            )}
          </g>
        )}

        {art.shape === "wave" && (
          <g fill="none" stroke="white" strokeOpacity="0.3" strokeWidth="10" strokeLinecap="round">
            {[80, 150, 220, 290].map((y) => (
              <path key={y} d={`M-20 ${y} Q 100 ${y - 55}, 200 ${y} T 420 ${y}`} />
            ))}
          </g>
        )}

        {art.shape === "bloom" && (
          <g fill="white" fillOpacity="0.22">
            {Array.from({ length: 8 }).map((_, i) => (
              <ellipse
                key={i}
                cx="200"
                cy="200"
                rx="42"
                ry="150"
                transform={`rotate(${i * 22.5} 200 200)`}
              />
            ))}
          </g>
        )}
      </svg>

      {/* Nozik don — qo'l mehnati his qilinsin */}
      <div className="grain pointer-events-none absolute inset-0" />
    </div>
  );
}
