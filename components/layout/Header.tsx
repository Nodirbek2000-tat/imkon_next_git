"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { LangSwitcher } from "@/components/ui/LangSwitcher";
import { useAuth } from "@/components/auth/AuthProvider";
import { useCart } from "@/components/cart/CartProvider";
import { Logo } from "@/components/ui/Logo";
import { cn, initialOf } from "@/lib/utils";

const nav = [
  { href: "/katalog", label: "Mahsulotlar" },
  { href: "/auksion", label: "Auksion" },
  { href: "/hunarmandlar", label: "Hunarmandlar" },
  { href: "/maktablar", label: "Maktablar" },
  { href: "/haqida", label: "Biz haqimizda" },
];

export function Header() {
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const reduced = useReducedMotion();
  const { user } = useAuth();
  const { count: cartCount } = useCart();
  const pathname = usePathname();
  // Kirgach shu sahifaga qaytish uchun — bosh sahifada yoki /kirish'ning
  // o'zida bo'lsa qo'shimcha parametr shart emas (ikkinchisi o'ziga
  // o'zi qaytadigan halqa bo'lib qolardi)
  const kirishHref =
    pathname && pathname !== "/" && pathname !== "/kirish"
      ? `/kirish?next=${encodeURIComponent(pathname)}`
      : "/kirish";

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Mobil menyu ochiq bo'lganda fon skroll qilinmasin
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  // Escape bilan yopish
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setOpen(false);
      setSearchOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const submitSearch = (event: React.FormEvent) => {
    event.preventDefault();
    const trimmed = query.trim();
    setSearchOpen(false);
    router.push(trimmed ? `/katalog?search=${encodeURIComponent(trimmed)}` : "/katalog");
  };

  return (
    <>
      <a
        href="#main"
        className="sr-only-focusable absolute top-4 left-4 z-100 rounded-full bg-brand-600 px-5 py-3 text-sm font-semibold text-white"
      >
        Asosiy kontentga o&apos;tish
      </a>

      <header
        className={cn(
          "sticky top-0 z-50 transition-all duration-500 [transition-timing-function:var(--ease-out-soft)]",
          scrolled
            ? "border-b bg-[var(--bg)]/85 backdrop-blur-xl"
            : "border-b border-transparent",
        )}
      >
        <Container>
          <div
            className={cn(
              "flex items-center justify-between gap-3 transition-all duration-500 sm:gap-6",
              scrolled ? "h-16" : "h-20",
            )}
          >
            <Link
              href="/"
              className="group flex shrink-0 items-center gap-2.5"
              aria-label="Imkon — bosh sahifa"
            >
              <Logo
                priority
                className="h-9 transition-transform duration-500 [transition-timing-function:var(--ease-spring)] group-hover:scale-105"
              />
            </Link>

            <nav aria-label="Asosiy" className="hidden lg:block">
              <ul className="flex items-center gap-1">
                {nav.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className="group relative block rounded-full px-4 py-2 text-[15px] font-medium text-ink-700 transition-colors duration-300 hover:text-brand-600 dark:text-ink-300 dark:hover:text-brand-400"
                    >
                      {item.label}
                      <span className="absolute inset-x-4 bottom-1 h-0.5 origin-left scale-x-0 rounded-full bg-brand-600 transition-transform duration-400 [transition-timing-function:var(--ease-out-soft)] group-hover:scale-x-100" />
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>

            <div className="relative flex items-center gap-1.5">
              <LangSwitcher />
              <ThemeToggle />
              <button
                type="button"
                aria-label={searchOpen ? "Qidiruvni yopish" : "Qidirish"}
                aria-expanded={searchOpen}
                onClick={() => setSearchOpen((s) => !s)}
                className="grid size-10 place-items-center rounded-full text-ink-600 transition-colors duration-300 hover:bg-ink-900/[0.06] hover:text-brand-600 dark:text-ink-400 dark:hover:bg-ink-100/10"
              >
                <SearchIcon />
              </button>

              <AnimatePresence>
                {searchOpen && (
                  <motion.form
                    onSubmit={submitSearch}
                    initial={{ opacity: 0, y: reduced ? 0 : -8, scale: reduced ? 1 : 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: reduced ? 0 : -8, scale: reduced ? 1 : 0.98 }}
                    transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                    className="absolute top-full right-0 z-10 mt-2 w-72 rounded-2xl border bg-[var(--surface)] p-2 shadow-[var(--shadow-lift)] sm:w-80"
                  >
                    <label htmlFor="header-search" className="sr-only">
                      Mahsulot yoki hunarmand qidirish
                    </label>
                    <div className="relative">
                      <input
                        id="header-search"
                        type="search"
                        autoFocus
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Mahsulot yoki hunarmand qidirish…"
                        className="h-11 w-full rounded-xl border-2 border-[var(--line)] bg-[var(--bg)] pr-11 pl-10 text-[15px] outline-none focus:border-brand-600"
                      />
                      <svg
                        className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-ink-400"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        aria-hidden="true"
                      >
                        <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
                        <path d="m20 20-3.5-3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                      </svg>
                      <button
                        type="submit"
                        aria-label="Qidirish"
                        className="absolute top-1/2 right-1.5 grid size-8 -translate-y-1/2 place-items-center rounded-lg text-ink-500 transition-colors hover:bg-brand-600 hover:text-white dark:text-ink-400"
                      >
                        <SearchIcon width={16} height={16} />
                      </button>
                    </div>
                  </motion.form>
                )}
              </AnimatePresence>

              {user && (
                <Link
                  href="/sevimlilar"
                  aria-label="Sevimlilarim"
                  className="hidden size-10 place-items-center rounded-full text-ink-600 transition-colors duration-300 hover:bg-ink-900/[0.06] hover:text-brand-600 sm:grid dark:text-ink-400 dark:hover:bg-ink-100/10"
                >
                  <HeartIcon />
                </Link>
              )}

              <Link
                href="/savat"
                aria-label="Savat"
                className="relative grid size-10 place-items-center rounded-full text-ink-600 transition-colors duration-300 hover:bg-ink-900/[0.06] hover:text-brand-600 dark:text-ink-400 dark:hover:bg-ink-100/10"
              >
                <CartIcon />
                {cartCount > 0 && (
                  <span className="absolute top-1 right-1 grid size-4 place-items-center rounded-full bg-brand-600 text-[10px] font-bold text-white">
                    {cartCount > 9 ? "9+" : cartCount}
                  </span>
                )}
              </Link>

              {user?.is_admin && (
                <Link
                  href="/admin"
                  className="hidden items-center gap-1.5 rounded-full bg-brand-600 px-4 py-2 text-[13px] font-bold text-white transition-all duration-300 [transition-timing-function:var(--ease-out-soft)] hover:-translate-y-0.5 hover:bg-brand-700 sm:inline-flex"
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path
                      d="M12 3 5 6v6c0 4.5 3 8 7 9 4-1 7-4.5 7-9V6l-7-3Z"
                      stroke="currentColor"
                      strokeWidth="2.2"
                      strokeLinejoin="round"
                    />
                  </svg>
                  Admin
                </Link>
              )}

              {user ? (
                <Link
                  href="/profil"
                  className="ml-1 hidden items-center gap-2 rounded-full border-2 border-[var(--line)] py-1.5 pr-4 pl-1.5 text-sm font-semibold transition-colors duration-300 hover:border-brand-600 sm:inline-flex"
                >
                  <span className="grid size-7 place-items-center rounded-full bg-brand-600 text-xs font-bold text-white">
                    {initialOf(user.full_name, user.phone)}
                  </span>
                  {user.full_name.split(" ")[0] || "Profil"}
                </Link>
              ) : (
                <Button href={kirishHref} size="sm" className="ml-1 hidden sm:inline-flex">
                  Kirish
                </Button>
              )}

              <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                aria-expanded={open}
                aria-controls="mobile-menu"
                aria-label={open ? "Menyuni yopish" : "Menyuni ochish"}
                className="grid size-10 place-items-center rounded-full text-ink-800 transition-colors hover:bg-ink-900/[0.06] lg:hidden dark:text-ink-200 dark:hover:bg-ink-100/10"
              >
                <BurgerIcon open={open} />
              </button>
            </div>
          </div>
        </Container>
      </header>

      <AnimatePresence>
        {open && (
          <motion.div
            id="mobile-menu"
            initial={{ opacity: 0, y: reduced ? 0 : -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: reduced ? 0 : -12 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-x-0 top-16 z-40 border-b bg-[var(--bg)] lg:hidden"
          >
            <Container className="py-6">
              <ul className="space-y-1">
                {nav.map((item, i) => (
                  <motion.li
                    key={item.href}
                    initial={{ opacity: 0, x: reduced ? 0 : -16 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: reduced ? 0 : 0.05 + i * 0.05 }}
                  >
                    <Link
                      href={item.href}
                      onClick={() => setOpen(false)}
                      className="block rounded-2xl px-4 py-3.5 font-display text-xl font-bold transition-colors hover:bg-brand-50 hover:text-brand-700 dark:hover:bg-brand-950"
                    >
                      {item.label}
                    </Link>
                  </motion.li>
                ))}
              </ul>
              {user && (
                <Link
                  href="/sevimlilar"
                  onClick={() => setOpen(false)}
                  className="mt-2 flex items-center gap-2 rounded-2xl px-4 py-3.5 font-display text-xl font-bold transition-colors hover:bg-brand-50 hover:text-brand-700 dark:hover:bg-brand-950"
                >
                  <HeartIcon /> Sevimlilarim
                </Link>
              )}

              {user?.is_admin && (
                <Button
                  href="/admin"
                  size="lg"
                  className="mt-5 w-full"
                  onClick={() => setOpen(false)}
                >
                  Admin panel
                </Button>
              )}

              <Button
                href={user ? "/profil" : kirishHref}
                size="lg"
                variant={user?.is_admin ? "outline" : "primary"}
                className="mt-3 w-full"
                onClick={() => setOpen(false)}
              >
                {user ? "Mening profilim" : "Kirish / Ro'yxatdan o'tish"}
              </Button>
            </Container>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

/* --- Ikonkalar --- */

function SearchIcon({ width = 20, height = 20 }: { width?: number; height?: number }) {
  return (
    <svg width={width} height={height} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
      <path d="m20 20-3.5-3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function HeartIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path
        d="M12 21s-7.5-4.6-10-9.2C.5 8.4 2.3 5 5.8 5c2 0 3.4 1 4.2 2.2C10.8 6 12.2 5 14.2 5c3.5 0 5.3 3.4 3.8 6.8-2.5 4.6-10 9.2-10 9.2Z"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CartIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M3 4h2l2.4 11.2a2 2 0 0 0 2 1.6h7.5a2 2 0 0 0 2-1.55L20.5 8H6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="10" cy="20" r="1.4" fill="currentColor" />
      <circle cx="17" cy="20" r="1.4" fill="currentColor" />
    </svg>
  );
}

function BurgerIcon({ open }: { open: boolean }) {
  return (
    <span className="relative block h-4 w-5" aria-hidden="true">
      <span
        className={cn(
          "absolute left-0 h-0.5 w-full rounded-full bg-current transition-all duration-400 [transition-timing-function:var(--ease-out-soft)]",
          open ? "top-1/2 -translate-y-1/2 rotate-45" : "top-0",
        )}
      />
      <span
        className={cn(
          "absolute top-1/2 left-0 h-0.5 w-full -translate-y-1/2 rounded-full bg-current transition-all duration-300",
          open && "scale-x-0 opacity-0",
        )}
      />
      <span
        className={cn(
          "absolute left-0 h-0.5 w-full rounded-full bg-current transition-all duration-400 [transition-timing-function:var(--ease-out-soft)]",
          open ? "top-1/2 -translate-y-1/2 -rotate-45" : "bottom-0",
        )}
      />
    </span>
  );
}
