import { categories } from "@/lib/mock";

/** Aylanuvchi lenta — kategoriyalar. Dekorativ, screen reader o'qimaydi. */
export function Marquee() {
  const items = [...categories, "Qo'l mehnati", "Noyob ishlar"];

  return (
    <div
      aria-hidden="true"
      className="mask-fade-x overflow-hidden border-y bg-brand-600 py-4 select-none"
    >
      <div className="flex w-max animate-marquee">
        {[0, 1].map((copy) => (
          <div key={copy} className="flex shrink-0">
            {items.map((item) => (
              <span
                key={`${copy}-${item}`}
                className="flex items-center gap-8 px-8 font-display text-lg font-bold tracking-tight whitespace-nowrap text-white"
              >
                {item}
                <span className="text-brand-300">✦</span>
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
