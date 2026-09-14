import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { Logo } from "@/components/ui/Logo";

const columns = [
  {
    title: "Platforma",
    links: [
      { href: "/katalog", label: "Katalog" },
      { href: "/auksion", label: "Auksion" },
      { href: "/hunarmandlar", label: "Hunarmandlar" },
    ],
  },
  {
    title: "Sotuvchilarga",
    links: [
      { href: "/dokon-ochish", label: "Do'kon ochish" },
      { href: "/qollanma", label: "Qo'llanma" },
      { href: "/komissiya", label: "Komissiya" },
      { href: "/yordam", label: "Yordam markazi" },
    ],
  },
  {
    title: "Loyiha",
    links: [
      { href: "/haqida", label: "Biz haqimizda" },
      { href: "/homiylar", label: "Homiylar" },
      { href: "/qollab-quvvatlash", label: "Qo'llab-quvvatlash" },
      { href: "/aloqa", label: "Aloqa" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="mt-32 border-t bg-[var(--surface)]">
      <Container className="py-16">
        <div className="grid gap-12 lg:grid-cols-[1.4fr_repeat(3,1fr)]">
          <div className="max-w-sm">
            <Logo className="h-10" />
            <p className="mt-5 text-[15px] leading-relaxed text-ink-600 dark:text-ink-400">
              Imkoniyati cheklangan hunarmandlarning qo'l mehnatini jamiyatga
              tanitish va ularning ijodini qo'llab-quvvatlash platformasi.
            </p>
            <p className="mt-6 font-display text-lg font-bold text-brand-600">
              Iqtidorlar cheksizdir.
            </p>
          </div>

          {columns.map((col) => (
            <nav key={col.title} aria-label={col.title}>
              <h3 className="text-[11px] font-semibold tracking-[0.14em] text-ink-600 dark:text-ink-400 uppercase">
                {col.title}
              </h3>
              <ul className="mt-5 space-y-3">
                {col.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="group inline-flex items-center gap-1.5 text-[15px] text-ink-700 transition-colors duration-300 hover:text-brand-600 dark:text-ink-300 dark:hover:text-brand-400"
                    >
                      <span className="h-px w-0 bg-brand-600 transition-all duration-400 [transition-timing-function:var(--ease-out-soft)] group-hover:w-4" />
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="mt-14 flex flex-col items-center justify-between gap-4 border-t pt-8 sm:flex-row">
          <p className="text-sm text-ink-600 dark:text-ink-400">
            © {new Date().getFullYear()} Imkon. Barcha huquqlar himoyalangan.
          </p>
          <div className="flex gap-5 text-sm text-ink-600 dark:text-ink-400">
            <Link href="/shartlar" className="transition-colors hover:text-brand-600">
              Foydalanish shartlari
            </Link>
            <Link href="/maxfiylik" className="transition-colors hover:text-brand-600">
              Maxfiylik
            </Link>
          </div>
        </div>
      </Container>
    </footer>
  );
}
