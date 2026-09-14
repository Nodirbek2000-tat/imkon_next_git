import { Container } from "@/components/ui/Container";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Reveal } from "@/components/ui/Reveal";

const steps = [
  {
    n: "01",
    title: "Ro'yxatdan o'ting",
    text: "Telefon raqami yoki Google akkaunt bilan. SMS orqali tasdiqlash — bir daqiqa.",
  },
  {
    n: "02",
    title: "Xohlagan narsangizni oling",
    text: "Hamma oddiy foydalanuvchi bo'lib boshlaydi. Katalogdan sotib oling yoki auksionda taklif qiling.",
  },
  {
    n: "03",
    title: "Do'kon oching",
    text: "Hunarmand bo'lsangiz — akkaunt sozlamalarida ariza to'ldiring, hunaringiz haqida yozing.",
  },
  {
    n: "04",
    title: "Sotishni boshlang",
    text: "Ariza tasdiqlangach akkauntingiz sotuvchiga aylanadi va sotuvchi paneli ochiladi.",
  },
];

export function HowItWorks() {
  return (
    <section className="py-24 lg:py-32">
      <Container>
        <SectionHeader
          eyebrow="Qanday ishlaydi"
          title="To'rt qadamda"
          description="Sotib olish ham, sotish ham bitta akkaunt orqali. Alohida ro'yxatdan o'tish kerak emas."
        />

        <ol className="mt-16 grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, i) => (
            <li key={step.n}>
              <Reveal delay={i * 0.09}>
                <div className="group relative">
                  <span className="font-display text-6xl font-extrabold text-ink-200 transition-colors duration-500 group-hover:text-brand-600 dark:text-ink-800">
                    {step.n}
                  </span>

                  <span
                    aria-hidden="true"
                    className="mt-4 block h-0.5 w-12 bg-brand-600 transition-all duration-500 [transition-timing-function:var(--ease-out-soft)] group-hover:w-20"
                  />

                  <h3 className="mt-5 text-xl font-bold">{step.title}</h3>
                  <p className="mt-2.5 leading-relaxed text-ink-600 dark:text-ink-400">
                    {step.text}
                  </p>
                </div>
              </Reveal>
            </li>
          ))}
        </ol>
      </Container>
    </section>
  );
}
