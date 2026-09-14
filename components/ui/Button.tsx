import Link from "next/link";
import { cn } from "@/lib/utils";

type Variant = "primary" | "outline" | "ghost" | "dark";
type Size = "sm" | "md" | "lg";

const base =
  "group/btn relative inline-flex items-center justify-center gap-2 font-medium " +
  "rounded-full whitespace-nowrap select-none " +
  "transition-[transform,box-shadow,background-color,color,border-color] duration-300 " +
  "[transition-timing-function:var(--ease-out-soft)] " +
  "active:scale-[0.97] disabled:pointer-events-none disabled:opacity-50";

const variants: Record<Variant, string> = {
  primary:
    "bg-brand-600 text-white shadow-[var(--shadow-brand)] " +
    "hover:bg-brand-700 hover:-translate-y-0.5 hover:shadow-[0_12px_38px_rgb(220_27_56/0.42)]",
  outline:
    "border-2 border-ink-900 text-ink-900 dark:border-ink-100 dark:text-ink-100 " +
    "hover:bg-ink-900 hover:text-white dark:hover:bg-ink-100 dark:hover:text-ink-950 " +
    "hover:-translate-y-0.5",
  ghost:
    "text-ink-700 dark:text-ink-300 hover:bg-ink-900/[0.06] dark:hover:bg-ink-100/10 " +
    "hover:text-brand-600 dark:hover:text-brand-400",
  dark:
    "bg-ink-900 text-white dark:bg-ink-100 dark:text-ink-950 " +
    "hover:-translate-y-0.5 hover:shadow-[var(--shadow-lift)]",
};

const sizes: Record<Size, string> = {
  sm: "h-10 px-5 text-sm",
  md: "h-12 px-7 text-[15px]",
  lg: "h-14 px-9 text-base",
};

type Props = {
  variant?: Variant;
  size?: Size;
  className?: string;
  children: React.ReactNode;
} & (
  | ({ href: string } & Omit<React.ComponentProps<typeof Link>, "href">)
  | ({ href?: undefined } & React.ButtonHTMLAttributes<HTMLButtonElement>)
);

export function Button({
  variant = "primary",
  size = "md",
  className,
  children,
  ...props
}: Props) {
  const classes = cn(base, variants[variant], sizes[size], className);

  if (props.href !== undefined) {
    const { href, ...rest } = props;
    return (
      <Link href={href} className={classes} {...rest}>
        {children}
      </Link>
    );
  }

  const { href: _ignored, ...rest } = props;
  return (
    <button className={classes} {...rest}>
      {children}
    </button>
  );
}
