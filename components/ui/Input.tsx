import { cn } from "@/lib/utils";

type Props = {
  label: string;
  error?: string;
  hint?: string;
  id: string;
  // React 19'da `ref` oddiy prop — forwardRef kerak emas
  ref?: React.Ref<HTMLInputElement>;
} & React.InputHTMLAttributes<HTMLInputElement>;

export function Input({ label, error, hint, id, className, ...props }: Props) {
  const describedBy = [error && `${id}-error`, hint && `${id}-hint`]
    .filter(Boolean)
    .join(" ");

  return (
    <div className="w-full">
      <label htmlFor={id} className="mb-2 block text-sm font-semibold">
        {label}
      </label>

      <input
        id={id}
        aria-invalid={!!error}
        aria-describedby={describedBy || undefined}
        className={cn(
          "h-13 w-full rounded-2xl border-2 bg-[var(--surface)] px-4 text-[16px]",
          "transition-colors duration-300 outline-none",
          "placeholder:text-ink-400",
          error
            ? "border-brand-600"
            : "border-[var(--line)] focus:border-brand-600",
          className,
        )}
        {...props}
      />

      {hint && !error && (
        <p id={`${id}-hint`} className="mt-2 text-[13px] text-ink-600 dark:text-ink-400">
          {hint}
        </p>
      )}

      {error && (
        <p id={`${id}-error`} role="alert" className="mt-2 text-[13px] font-medium text-brand-600">
          {error}
        </p>
      )}
    </div>
  );
}

export function Textarea({
  label,
  error,
  id,
  className,
  ...props
}: { label: string; error?: string; id: string } & React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <div className="w-full">
      <label htmlFor={id} className="mb-2 block text-sm font-semibold">
        {label}
      </label>
      <textarea
        id={id}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-error` : undefined}
        className={cn(
          "min-h-32 w-full rounded-2xl border-2 bg-[var(--surface)] p-4 text-[16px]",
          "transition-colors duration-300 outline-none resize-y",
          error ? "border-brand-600" : "border-[var(--line)] focus:border-brand-600",
          className,
        )}
        {...props}
      />
      {error && (
        <p id={`${id}-error`} role="alert" className="mt-2 text-[13px] font-medium text-brand-600">
          {error}
        </p>
      )}
    </div>
  );
}

export function Select({
  label,
  error,
  id,
  className,
  children,
  ...props
}: { label: string; error?: string; id: string } & React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className="w-full">
      <label htmlFor={id} className="mb-2 block text-sm font-semibold">
        {label}
      </label>
      <select
        id={id}
        aria-invalid={!!error}
        className={cn(
          "h-13 w-full rounded-2xl border-2 bg-[var(--surface)] px-4 text-[16px]",
          "transition-colors duration-300 outline-none",
          error ? "border-brand-600" : "border-[var(--line)] focus:border-brand-600",
          className,
        )}
        {...props}
      >
        {children}
      </select>
      {error && (
        <p role="alert" className="mt-2 text-[13px] font-medium text-brand-600">
          {error}
        </p>
      )}
    </div>
  );
}
