import { Container } from "@/components/ui/Container";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Reveal } from "@/components/ui/Reveal";
import { ProductCard } from "@/components/ProductCard";
import { products } from "@/lib/mock";

/**
 * Bosh sahifadagi "Eng yangi ishlar" — bezak bo'lim.
 *
 * Ma'lumot bazadan emas, `lib/mock`dan: bu yer platforma nimaligini
 * ko'rsatib beradigan vitrina. Kartaning o'zi bosilsa katalogga olib
 * boradi, haqiqiy mahsulotlar o'sha yerda.
 *
 * 10 ta karta — 5 tadan 2 qator.
 */
export function FeaturedWorks() {
  return (
    <section className="py-24 lg:py-32">
      <Container>
        <SectionHeader
          eyebrow="Eng yangi ishlar"
          title="Har biri qo'lda ishlangan"
          description="Bu yerdagi hech bir buyum takrorlanmaydi. Har biri ortida o'z hikoyasi bo'lgan hunarmand turadi."
          action={{ href: "/katalog", label: "Hammasini ko'rish" }}
        />

        <ul className="mt-14 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {products.slice(0, 10).map((product, i) => (
            <li key={product.id}>
              <Reveal delay={Math.min(i, 4) * 0.06}>
                <ProductCard product={product} />
              </Reveal>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}
