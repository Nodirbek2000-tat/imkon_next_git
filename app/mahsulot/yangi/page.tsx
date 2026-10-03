"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { PageLoader } from "@/components/ui/Skeleton";
import { useAuth } from "@/components/auth/AuthProvider";
import { ProductForm } from "@/components/mahsulot/ProductForm";

/** `useSearchParams()` uchun Suspense — `/kirish` dagi bilan bir sabab. */
export default function NewProductPage() {
  return (
    <Suspense fallback={null}>
      <NewProductContent />
    </Suspense>
  );
}

function NewProductContent() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const searchParams = useSearchParams();

  // Maktab panelidagi o'quvchi kartasi shu havola bilan keladi —
  // forma o'sha bolani oldindan tanlab ochiladi.
  const student = searchParams.get("oquvchi") ?? undefined;

  useEffect(() => {
    if (loading) return;
    if (!user) router.replace("/kirish");
    // Mahsulotni hunarmand o'z nomidan, maktab esa o'quvchisi nomidan qo'yadi
    else if (!user.is_artisan && !user.is_school) router.replace("/profil");
  }, [loading, user, router]);

  if (loading) return <PageLoader label="Tekshirilmoqda" />;
  if (!user || (!user.is_artisan && !user.is_school)) return null;

  return (
    <>
      <PageHeader
        eyebrow={user.is_school ? "Maktab paneli" : "Sotuvchi paneli"}
        title="Yangi ish qo'shish"
        description={
          user.is_school
            ? "Avval ishni qaysi o'quvchi qilganini tanlang, keyin rasm, tavsif va narxni kiriting. Ish o'quvchi nomidan katalogda paydo bo'ladi."
            : "Rasmlar, tavsif va narxni kiriting. Qo'shilgach mahsulot darhol katalogda paydo bo'ladi."
        }
      />
      <ProductForm initialStudent={student} />
    </>
  );
}
