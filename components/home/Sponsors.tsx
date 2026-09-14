import { Container } from "@/components/ui/Container";
import { Reveal } from "@/components/ui/Reveal";
import { sponsors } from "@/lib/mock";

export function Sponsors() {
  return (
    <section className="py-24 lg:py-28">
      <Container>
        <Reveal>
          <p className="text-center text-[11px] font-semibold tracking-[0.16em] text-ink-600 dark:text-ink-400 uppercase">
            Homiylar
          </p>
          <p className="mx-auto mt-4 max-w-xl text-center text-[17px] leading-relaxed text-ink-600 dark:text-ink-400">
            Loyihani qo'llab-quvvatlayotgan va hunarmandlar orzulariga qanot
            bag'ishlayotgan hamkorlarimizga minnatdorchilik bildiramiz.
          </p>
        </Reveal>

        <Reveal delay={0.12}>
          <ul className="mt-12 grid grid-cols-2 gap-px overflow-hidden rounded-[var(--radius-card)] border bg-[var(--line)] sm:grid-cols-3 lg:grid-cols-6">
            {sponsors.map((name) => (
              <li key={name}>
                <div className="group flex h-24 items-center justify-center bg-[var(--bg)] px-4 transition-colors duration-400 hover:bg-brand-600">
                  <span className="text-center font-display text-[15px] font-bold text-ink-600 dark:text-ink-400 transition-colors duration-400 group-hover:text-white">
                    {name}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </Reveal>
      </Container>
    </section>
  );
}
