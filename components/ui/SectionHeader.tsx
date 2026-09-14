import Link from "next/link";
import { Reveal } from "@/components/ui/Reveal";

export function SectionHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  action?: { href: string; label: string };
}) {
  return (
    <Reveal>
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div className="max-w-2xl">
          <span className="flex items-center gap-3 text-[11px] font-semibold tracking-[0.16em] text-brand-600 uppercase">
            <span className="h-px w-8 bg-brand-600" />
            {eyebrow}
          </span>

          <h2 className="mt-4 text-[clamp(1.9rem,4vw,2.9rem)] leading-[1.05] font-extrabold">
            {title}
          </h2>

          {description && (
            <p className="mt-4 text-[17px] leading-relaxed text-ink-600 dark:text-ink-400">
              {description}
            </p>
          )}
        </div>

        {action && (
          <Link
            href={action.href}
            className="group inline-flex items-center gap-2 rounded-full border-2 border-ink-900 px-6 py-3 text-[15px] font-semibold transition-all duration-400 [transition-timing-function:var(--ease-out-soft)] hover:-translate-y-0.5 hover:border-brand-600 hover:bg-brand-600 hover:text-white dark:border-ink-100"
          >
            {action.label}
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path
                d="M3 8h10M9 4l4 4-4 4"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="transition-transform duration-400 group-hover:translate-x-1"
              />
            </svg>
          </Link>
        )}
      </div>
    </Reveal>
  );
}
