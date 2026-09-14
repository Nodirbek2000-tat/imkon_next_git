"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { PageLoader } from "@/components/ui/Skeleton";
import { useAuth } from "@/components/auth/AuthProvider";
import { ProductForm } from "@/components/mahsulot/ProductForm";
import { api, type ApiProductDetail } from "@/lib/api";

export default function EditProductPage() {
  const router = useRouter();
  const { slug } = useParams<{ slug: string }>();
  const { user, loading } = useAuth();

  const [product, setProduct] = useState<ApiProductDetail | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/kirish");
      return;
    }
    if (!user.is_artisan) {
      router.replace("/profil");
      return;
    }

    api
      .product(slug, "uz")
      .then((data) => {
        // Faqat egasi tahrirlay oladi (backend ham tekshiradi — bu UI qulayligi)
        if (data.artisan.slug !== user.artisan_slug) router.replace("/profil");
        else setProduct(data);
      })
      .catch(() => setNotFound(true));
  }, [loading, user, slug, router]);

  if (loading || (!product && !notFound)) return <PageLoader label="Yuklanmoqda" />;
  if (notFound)
    return (
      <PageHeader
        eyebrow="Xatolik"
        title="Mahsulot topilmadi"
        description="Bu mahsulot o'chirilgan yoki mavjud emas."
      />
    );
  if (!product) return null;

  return (
    <>
      <PageHeader
        eyebrow="Sotuvchi paneli"
        title="Mahsulotni tahrirlash"
        description={product.title}
      />
      <ProductForm initialProduct={product} />
    </>
  );
}
