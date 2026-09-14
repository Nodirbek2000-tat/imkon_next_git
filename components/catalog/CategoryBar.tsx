"use client";

import { cn } from "@/lib/utils";
import type { ApiCategory } from "@/lib/api";

/**
 * Kategoriya ikonkalari — shaffof fonli 3D rasmlar.
 *
 * Kalit — bazadagi kategoriya `slug`i. Ro'yxatda bo'lmagan kategoriya
 * bazadagi emoji bilan ko'rinaveradi, ya'ni yangi kategoriya qo'shilsa
 * hech narsa buzilmaydi — faqat ikonkasiz qoladi.
 */
const ICONS: Record<string, string> = {
  rasmlar: "/kategoriyalar/rasmlar.png",
  toqima: "/kategoriyalar/toqima.png",
  "yogoch-buyum": "/kategoriyalar/yogoch-buyum.png",
  sopol: "/kategoriyalar/sopol.png",
  taqinchoq: "/kategoriyalar/taqinchoq.png",
  oyinchoqlar: "/kategoriyalar/oyinchoqlar.png",
};

/**
 * Tepada ikonkali kategoriya qatori — Uzum Market'dagi kategoriya
 * navigatsiyasiga yaqin uslub, lekin loyihaning o'z qizil palitrasida.
 */
export function CategoryBar({
  categories,
  active,
  onSelect,
}: {
  categories: ApiCategory[];
  active: string;
  onSelect: (slug: string) => void;
}) {
  return (
    <div
      role="tablist"
      aria-label="Kategoriyalar"
      className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-3 sm:mx-0 sm:px-0"
    >
      <CategoryChip active={!active} onClick={() => onSelect("")} icon="✨" label="Hammasi" />
      {categories.map((c) => (
        <CategoryChip
          key={c.slug}
          active={active === c.slug}
          onClick={() => onSelect(c.slug)}
          icon={c.icon || "🏷️"}
          image={ICONS[c.slug]}
          label={c.name}
        />
      ))}
    </div>
  );
}

function CategoryChip({
  active,
  onClick,
  icon,
  image,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: string;
  image?: string;
  label: string;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={cn(
        "flex shrink-0 flex-col items-center gap-1 rounded-xl border-2 px-3.5 py-2.5",
        "transition-all duration-300 [transition-timing-function:var(--ease-out-soft)]",
        active
          ? "border-brand-600 bg-brand-600 text-white shadow-[var(--shadow-brand)]"
          : "border-[var(--line)] bg-[var(--surface)] hover:-translate-y-0.5 hover:border-brand-600 hover:text-brand-600",
      )}
    >
      {image ? (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          src={image}
          alt=""
          aria-hidden="true"
          className="size-8 object-contain"
        />
      ) : (
        <span className="grid size-8 place-items-center text-lg leading-none" aria-hidden="true">
          {icon}
        </span>
      )}
      <span className="text-[12px] font-semibold whitespace-nowrap">{label}</span>
    </button>
  );
}
