import { Container } from "@/components/ui/Container";

export function PageHeader({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  children?: React.ReactNode;
}) {
  return (
    <section className="relative overflow-hidden border-b py-9 lg:py-11">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-40 right-0 size-[360px] rounded-full bg-radial from-brand-500/15 to-transparent blur-3xl"
      />
      <Container className="relative">
        {eyebrow && (
          <span className="flex items-center gap-3 text-[11px] font-semibold tracking-[0.16em] text-brand-600 uppercase">
            <span className="h-px w-8 bg-brand-600" />
            {eyebrow}
          </span>
        )}
        <h1 className="mt-3 text-[clamp(1.5rem,3vw,2.25rem)] leading-[1.05] font-extrabold">
          {title}
        </h1>
        {description && (
          <p className="mt-2.5 max-w-2xl text-[15px] leading-relaxed text-ink-600 dark:text-ink-400">
            {description}
          </p>
        )}
        {children}
      </Container>
    </section>
  );
}

export function EmptyState({
  title,
  hint,
  icon,
}: {
  title: string;
  hint?: string;
  icon?: string;
}) {
  return (
    <div className="rounded-[var(--radius-card)] border-2 border-dashed py-20 text-center">
      {icon && (
        <span className="mb-3 block text-4xl" aria-hidden="true">
          {icon}
        </span>
      )}
      <p className="font-display text-xl font-bold">{title}</p>
      {hint && <p className="mt-2 text-ink-600 dark:text-ink-400">{hint}</p>}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div
      role="alert"
      className="rounded-[var(--radius-card)] border-2 border-brand-600/40 bg-brand-50 p-8 text-center dark:bg-brand-950/40"
    >
      <p className="font-display text-lg font-bold text-brand-700 dark:text-brand-300">
        Xatolik yuz berdi
      </p>
      <p className="mt-2 text-ink-700 dark:text-ink-300">{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-5 rounded-full bg-brand-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700"
        >
          Qayta urinish
        </button>
      )}
    </div>
  );
}
