"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { PageLoader } from "@/components/ui/Skeleton";
import { useAuth } from "@/components/auth/AuthProvider";
import { ProductForm } from "@/components/mahsulot/ProductForm";

export default function NewProductPage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (loading) return;
    if (!user) router.replace("/kirish");
    else if (!user.is_artisan) router.replace("/profil");
  }, [loading, user, router]);

  if (loading) return <PageLoader label="Tekshirilmoqda" />;
  if (!user?.is_artisan) return null;

  return (
    <>
      <PageHeader
        eyebrow="Sotuvchi paneli"
        title="Yangi ish qo'shish"
        description="Rasmlar, tavsif va narxni kiriting. Qo'shilgach mahsulot darhol katalogda paydo bo'ladi."
      />
      <ProductForm />
    </>
  );
}
