import { Container } from "@/components/ui/Container";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Reveal } from "@/components/ui/Reveal";
import { AuctionCard } from "@/components/AuctionCard";
import { auctions } from "@/lib/mock";

/**
 * "Jonli auksion" — bezak bo'lim, `FeaturedWorks` kabi namuna ma'lumot
 * bilan ishlaydi. Karta bosilsa auksionlar ro'yxatiga o'tadi.
 */
export function LiveAuctions() {
  return (
    <section className="relative overflow-hidden bg-[var(--surface)] py-24 lg:py-32">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 left-1/2 size-[900px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-radial from-brand-500/8 to-transparent blur-3xl"
      />

      <Container className="relative">
        <SectionHeader
          eyebrow="Jonli auksion"
          title="Narxni siz belgilaysiz"
          description="Taklif qiling, kuzating, yuting. Har bir taklif hunarmandning mehnatiga qo'yilgan qiymat."
          action={{ href: "/auksion", label: "Barcha lotlar" }}
        />

        <ul className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {auctions.map((auction, i) => (
            <li key={auction.id}>
              <Reveal delay={i * 0.1}>
                <AuctionCard auction={auction} />
              </Reveal>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}
