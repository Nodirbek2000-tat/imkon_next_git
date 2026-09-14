import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { Reveal } from "@/components/ui/Reveal";
import { TeamMember, type Member } from "@/components/haqida/TeamMember";

export const metadata: Metadata = {
  title: "Biz haqimizda",
  description:
    "Imkon — imkoniyati cheklangan hunarmandlarning qo'l mehnatini jamiyatga tanitish va ularga adolatli daromad yaratish uchun qurilgan platforma.",
};

const TEAM: Member[] = [
  {
    name: "Malika Kamoliddinovna",
    role: "Asoschi va bosh direktor",
    roleShort: "CEO & Founder",
    photo: "/jamoa/malika_opa.jpg",
    quote: [
      "Men bolalar orasida ishladim va ularda juda ko'p narsani ko'rdim. Qo'llari bilan yaratgan har bir buyumda sabr bor edi, mehr bor edi, o'z hikoyasi bor edi. Ammo bu ishlar ko'pincha to'rt devor ichida qolib ketardi — ko'rmagan odam ularning qadrini ham bilmasdi.",
      "Shunda bir narsani angladim: bu insonlarga achinish emas, imkon kerak. Ular allaqachon iqtidorli — faqat ovozlari eshitiladigan joy yetishmayapti. Ana shu fikrdan Imkon g'oyasi tug'ildi va biz uni birgalikda qura boshladik.",
    ],
  },
  {
    name: "Nodirbek Shukurov",
    role: "Veb-dasturchi",
    roleShort: "Web Developer",
    photo: "/jamoa/nodirbekrasm.jpg",
    quote: [
      "Imkonni qurish davomida eng ko'p o'ylagan narsam — bu saytdan kim foydalanishi. Shuning uchun har bir tugmani klaviatura bilan bosib ko'rdim, matnlar ekran o'quvchi uchun qanday o'qilishini tekshirdim. Bu yerda dizayn go'zalligidan oldin foydalana olish turadi.",
      "Texnologiya odamga xizmat qilishi kerak, teskarisi emas. Agar hunarmand telefonidan bir necha bosishda o'z ishini sotuvga qo'ya olsa — demak, men vazifamni to'g'ri bajaribman.",
    ],
  },
];

export default function AboutPage() {
  return (
    <>
      {/* ---------------------------------------------- Sarlavha */}
      <section className="relative overflow-hidden border-b py-16 lg:py-24">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-40 -right-20 size-[520px] rounded-full bg-radial from-brand-500/15 to-transparent blur-3xl"
        />
        <Container className="relative">
          <Reveal>
            <span className="flex items-center gap-3 text-[11px] font-semibold tracking-[0.16em] text-brand-600 uppercase">
              <span className="h-px w-8 bg-brand-600" />
              Biz haqimizda
            </span>

            <h1 className="mt-5 max-w-4xl text-[clamp(2rem,5vw,3.5rem)] leading-[1.02] font-extrabold">
              Iqtidor imkoniyatga qarab{" "}
              <span className="text-brand-600">o&apos;lchanmaydi</span>
            </h1>

            <p className="mt-6 max-w-2xl text-[17px] leading-relaxed text-ink-600 dark:text-ink-400">
              Imkon — imkoniyati cheklangan hunarmandlar uchun qurilgan onlayn savdo va
              auksion maydoni. Bu yerda qo&apos;l mehnati o&apos;z qadrini topadi, hunarmand
              esa o&apos;z ovoziga ega bo&apos;ladi.
            </p>
          </Reveal>
        </Container>
      </section>

      {/* ---------------------------------------------- Nega bu loyiha */}
      <section className="py-16 lg:py-24">
        <Container>
          <div className="grid gap-12 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:gap-16">
            <Reveal>
              <h2 className="text-[clamp(1.6rem,3.5vw,2.5rem)] leading-tight font-extrabold">
                Nega bu loyiha kerak bo&apos;ldi?
              </h2>
            </Reveal>

            <Reveal delay={0.1}>
              <div className="space-y-5 text-[17px] leading-relaxed text-ink-700 dark:text-ink-300">
                <p>
                  O&apos;zbekistonda imkoniyati cheklangan minglab inson bor. Ularning
                  ko&apos;pchiligi qo&apos;li bilan ajoyib narsalar yaratadi — sopol idish,
                  gilam, yog&apos;och o&apos;ymakorlik, zargarlik buyumlari. Har biri yagona
                  nusxa, har biri ortida sabr va mahorat turadi.
                </p>
                <p>
                  Lekin bu mehnat ko&apos;pincha uy ichida qolib ketadi. Do&apos;kon ochish
                  qiyin, bozorga har kuni chiqish undan ham qiyin, vositachilar esa
                  daromadning kattasini oladi. Natijada iqtidor bor —{" "}
                  <span className="font-semibold text-ink-900 dark:text-ink-100">
                    imkon yo&apos;q
                  </span>
                  .
                </p>
                <p>
                  Imkon aynan shu bo&apos;shliqni to&apos;ldirish uchun qurildi. Biz
                  hunarmandga do&apos;kon, xaridorga esa noyob ish beramiz — orada ortiqcha
                  hech kim yo&apos;q. Loyihaning nomi ham shundan: har bir iqtidorga
                  ko&apos;rinish va munosib haq olish imkoni.
                </p>
              </div>
            </Reveal>
          </div>
        </Container>
      </section>

      {/* ---------------------------------------------- Jamoa */}
      <section className="border-t py-16 lg:py-24">
        <Container>
          <Reveal>
            <span className="flex items-center gap-3 text-[11px] font-semibold tracking-[0.16em] text-brand-600 uppercase">
              <span className="h-px w-8 bg-brand-600" />
              Jamoa
            </span>
            <h2 className="mt-4 text-[clamp(1.6rem,3.5vw,2.5rem)] leading-tight font-extrabold">
              Jamoa a&apos;zolari
            </h2>
            <p className="mt-4 max-w-2xl text-[17px] leading-relaxed text-ink-600 dark:text-ink-400">
              Loyiha ortida turgan insonlar — har biri Imkon g&apos;oyasiga o&apos;z
              hissasini qo&apos;shmoqda.
            </p>
          </Reveal>

          <div className="mt-10 space-y-6">
            {TEAM.map((member, i) => (
              <Reveal key={member.name} delay={i * 0.1}>
                {/* Juft/toq — kartalar navbatma-navbat qarama-qarshi tomonga qaraydi */}
                <TeamMember member={member} flip={i % 2 === 1} />
              </Reveal>
            ))}
          </div>
        </Container>
      </section>

    </>
  );
}
