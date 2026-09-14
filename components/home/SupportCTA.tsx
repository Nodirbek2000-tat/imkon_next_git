import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { Reveal } from "@/components/ui/Reveal";

export function SupportCTA() {
  return (
    <section className="pb-8">
      <Container>
        <Reveal>
          <div className="grain relative overflow-hidden rounded-[2rem] bg-brand-600 px-8 py-20 text-center sm:px-16">
            {/* Dekorativ halqalar */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -top-24 -left-24 size-96 rounded-full border-[3px] border-white/10"
            />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -right-32 -bottom-32 size-[26rem] rounded-full border-[3px] border-white/10"
            />

            <div className="relative mx-auto max-w-2xl">
              <h2 className="text-[clamp(2rem,4.5vw,3.25rem)] leading-[1.05] font-extrabold text-white">
                Birgalikda yorqin kelajak quramiz
              </h2>

              <p className="mx-auto mt-6 max-w-lg text-lg leading-relaxed text-white/85">
                Sizning kichik yordamingiz hunarmand uchun ulkan imkoniyat.
                Sotib oling, ulashing yoki to'g'ridan-to'g'ri qo'llab-quvvatlang.
              </p>

              <div className="mt-10 flex flex-wrap justify-center gap-3">
                <Button
                  href="/qollab-quvvatlash"
                  size="lg"
                  className="bg-white text-brand-700 shadow-none hover:bg-ink-50 hover:shadow-[0_12px_38px_rgb(0_0_0/0.18)]"
                >
                  Qo'llab-quvvatlash
                </Button>
                <Button
                  href="/dokon-ochish"
                  size="lg"
                  variant="ghost"
                  className="border-2 border-white/40 text-white hover:bg-white/10 hover:text-white"
                >
                  Do'kon ochish
                </Button>
              </div>
            </div>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
