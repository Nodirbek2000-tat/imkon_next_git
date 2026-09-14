import { cn } from "@/lib/utils";

type Tone = "brand" | "gold" | "neutral" | "live" | "success";

const tones: Record<Tone, string> = {
  brand: "bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300",
  gold: "bg-gold-100 text-gold-700 dark:bg-gold-700/20 dark:text-gold-300",
  neutral: "bg-ink-100 text-ink-700 dark:bg-ink-800 dark:text-ink-300",
  live: "bg-brand-600 text-white",
  success: "bg-success/12 text-success dark:bg-success/20",
};

export function Badge({
  tone = "neutral",
  className,
  children,
}: {
  tone?: Tone;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-3 py-1",
        "text-[11px] font-semibold tracking-[0.09em] uppercase",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

/** Jonli auksion / e'tibor talab qiladigan holat uchun pulsatsiyalanuvchi nuqta */
export function LiveDot({ className }: { className?: string }) {
  const color = className ?? "bg-white";
  return (
    <span className="relative flex size-2">
      <span className={cn("absolute inline-flex size-full animate-ping rounded-full opacity-75", color)} />
      <span className={cn("relative inline-flex size-2 rounded-full", color)} />
    </span>
  );
}
