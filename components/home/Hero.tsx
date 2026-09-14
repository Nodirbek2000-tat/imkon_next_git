"use client";

import { motion, useReducedMotion } from "motion/react";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { Artwork } from "@/components/ui/Artwork";
import { products, stats } from "@/lib/mock";

export function Hero() {
  const reduced = useReducedMotion();

  const rise = (delay: number) => ({
    initial: reduced ? { opacity: 0 } : { opacity: 0, y: 30 },
    animate: { opacity: 1, y: 0 },
    transition: {
      duration: reduced ? 0.25 : 0.85,
      delay: reduced ? 0 : delay,
      ease: [0.22, 1, 0.36, 1] as const,
    },
  });

  return (
    <section className="relative overflow-hidden pt-12 pb-20 lg:pt-20 lg:pb-28">
      {/* Fon: yumshoq qizil nur */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-40 -right-40 size-[680px] rounded-full bg-radial from-brand-500/20 via-brand-500/5 to-transparent blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-52 -left-40 size-[520px] rounded-full bg-radial from-gold-500/15 to-transparent blur-3xl"
      />

      <Container>
        <div className="grid items-center gap-14 lg:grid-cols-[1.05fr_0.95fr] lg:gap-10">
          {/* --- Chap: matn --- */}
          <div>
            <motion.h1
              {...rise(0)}
              className="text-[clamp(2.75rem,7vw,4.75rem)] leading-[0.95] font-extrabold"
            >
              Iqtidorlar{" "}
              <span className="relative inline-block text-brand-600">
                cheksiz
                <svg
                  className="absolute -bottom-2 left-0 w-full"
                  viewBox="0 0 200 12"
                  fill="none"
                  aria-hidden="true"
                >
                  <motion.path
                    d="M2 8c40-5 90-7 196-3"
                    stroke="currentColor"
                    strokeWidth="4"
                    strokeLinecap="round"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: reduced ? 0 : 1.1, delay: 0.7 }}
                  />
                </svg>
              </span>
              <br />
              va biz buni ko'rsatamiz
            </motion.h1>

            <motion.p
              {...rise(0.2)}
              className="mt-8 max-w-xl text-lg leading-relaxed text-ink-600 dark:text-ink-400"
            >
              Imkoniyati cheklangan hunarmandlar o'z qo'l mehnatini shu yerda
              sotadi. Siz esa noyob ish sotib olasiz — yoki auksionda o'z
              narxingizni taklif qilasiz.
            </motion.p>

            <motion.div {...rise(0.3)} className="mt-10 flex flex-wrap gap-3">
              <Button href="/katalog" size="lg">
                Ishlarni ko'rish
                <svg width="18" height="18" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <path
                    d="M3 8h10M9 4l4 4-4 4"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="transition-transform duration-400 group-hover/btn:translate-x-1"
                  />
                </svg>
              </Button>
              <Button href="/auksion" size="lg" variant="outline">
                Jonli auksion
              </Button>
            </motion.div>

            {/* Statistika */}
            <motion.dl
              {...rise(0.42)}
              className="mt-14 grid max-w-lg grid-cols-2 gap-x-6 gap-y-7 sm:grid-cols-4"
            >
              {stats.map((s) => (
                <div key={s.label}>
                  <dt className="sr-only">{s.label}</dt>
                  <dd>
                    <span className="block font-display text-3xl font-extrabold">
                      {s.value}
                    </span>
                    <span className="mt-1 block text-[13px] text-ink-600 dark:text-ink-400">
                      {s.label}
                    </span>
                  </dd>
                </div>
              ))}
            </motion.dl>
          </div>

          {/* --- O'ng: suzuvchi kollaj --- */}
          <div className="relative mx-auto w-full max-w-md lg:max-w-none">
            <motion.div
              initial={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.92, rotate: -3 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              transition={{ duration: reduced ? 0.3 : 1, ease: [0.22, 1, 0.36, 1] }}
              className="relative aspect-square"
            >
              <div className="absolute top-0 left-0 w-[62%] animate-float">
                <Card p={products[0]} />
              </div>

              <div
                className="absolute right-0 bottom-[6%] w-[54%] animate-float"
                style={{ animationDelay: "-2.5s" }}
              >
                <Card p={products[4]} />
              </div>

              <div
                className="absolute top-[34%] right-[8%] w-[38%] animate-float"
                style={{ animationDelay: "-5s" }}
              >
                <Card p={products[2]} small />
              </div>
            </motion.div>
          </div>
        </div>
      </Container>
    </section>
  );
}

function Card({
  p,
  small,
}: {
  p: (typeof products)[number];
  small?: boolean;
}) {
  return (
    <div className="group overflow-hidden rounded-[var(--radius-card)] border bg-[var(--surface)] shadow-[var(--shadow-lift)]">
      <Artwork art={p.art} image={p.image} alt={p.title} className="aspect-square" />
      {!small && (
        <div className="p-4">
          <p className="truncate text-sm font-bold">{p.title}</p>
          <p className="mt-0.5 text-xs text-ink-600 dark:text-ink-400">{p.seller.craft}</p>
        </div>
      )}
    </div>
  );
}
