"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { PageHeader, ErrorState } from "@/components/ui/PageHeader";
import { PageLoader } from "@/components/ui/Skeleton";
import { useAuth } from "@/components/auth/AuthProvider";
import { ProductForm } from "@/components/mahsulot/ProductForm";
import { api, ApiError, type ApiProductDetail } from "@/lib/api";

export default function EditProductPage() {
  const router = useRouter();
  const { slug } = useParams<{ slug: string }>();
  const { user, loading } = useAuth();

  const [product, setProduct] = useState<ApiProductDetail | null>(null);
  const [error, setError] = useState("");
  // Maktab o'z o'quvchisiga tegishli bo'lmagan ishni ochmoqchi bo'ldi.
  const [notMine, setNotMine] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/kirish");
      return;
    }
    if (!user.is_artisan && !user.is_school) {
      router.replace("/profil");
      return;
    }

    let alive = true;

    const load = async () => {
      let data: ApiProductDetail;
      try {
        data = await api.product(slug, "uz");
      } catch {
        if (alive) setError("Bu mahsulot o'chirilgan yoki mavjud emas.");
        return;
      }

      // Hunarmand faqat o'z ishini tahrirlaydi.
      if (!user.is_school) {
        if (data.artisan.slug !== user.artisan_slug) router.replace("/profil");
        else if (alive) setProduct(data);
        return;
      }

      // Maktab akkauntida ish egasi — o'quvchi, ya'ni slug'lar hech qachon
      // mos kelmaydi. Shuning uchun egalikni o'quvchilar ro'yxati bilan
      // tekshiramiz: aks holda maktab begona ishning formasini to'liq
      // ochib, narxini o'zgartirib, faqat "Saqlash"da tushunarsiz
      // 403 olardi.
      try {
        const students = await api.mySchoolStudents();
        if (!alive) return;
        if (students.some((s) => s.slug === data.artisan.slug)) setProduct(data);
        else setNotMine(true);
      } catch (err) {
        if (alive) {
          setError(
            err instanceof ApiError ? err.message : "O'quvchilar ro'yxati yuklanmadi",
          );
        }
      }
    };

    load();

    return () => {
      alive = false;
    };
  }, [loading, user, slug, router]);

  if (loading || (!product && !error && !notMine))
    return <PageLoader label="Yuklanmoqda" />;

  if (notMine)
    return (
      <>
        <PageHeader
          eyebrow="Maktab paneli"
          title="Bu ish sizning o'quvchingizga tegishli emas"
          description="Faqat o'z o'quvchilaringiz nomidan qo'yilgan ishlarni tahrirlay olasiz."
        />
        <Container className="py-12 text-center">
          <Button href="/profil" size="lg">
            Mening o&apos;quvchilarim
          </Button>
        </Container>
      </>
    );

  if (error || !product)
    return (
      <Container className="py-20">
        <ErrorState message={error || "Mahsulot topilmadi"} />
        <div className="mt-6 text-center">
          <Button href="/profil" variant="outline">
            Panelga qaytish
          </Button>
        </div>
      </Container>
    );

  return (
    <>
      <PageHeader
        eyebrow={user?.is_school ? "Maktab paneli" : "Sotuvchi paneli"}
        title="Mahsulotni tahrirlash"
        description={product.title}
      />
      <ProductForm initialProduct={product} />
    </>
  );
}
