import { Hero } from "@/components/home/Hero";
import { Marquee } from "@/components/home/Marquee";
import { FeaturedWorks } from "@/components/home/FeaturedWorks";
import { LiveAuctions } from "@/components/home/LiveAuctions";
import { HowItWorks } from "@/components/home/HowItWorks";
import { SupportCTA } from "@/components/home/SupportCTA";

export default function Home() {
  return (
    <>
      <Hero />
      <Marquee />
      <FeaturedWorks />
      <LiveAuctions />
      <HowItWorks />
      <SupportCTA />
    </>
  );
}
