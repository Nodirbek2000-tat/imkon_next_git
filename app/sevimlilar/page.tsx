"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Container } from "@/components/ui/Container";
import { PageHeader, EmptyState, ErrorState } from "@/components/ui/PageHeader";
import { ProductCardSkeleton } from "@/components/ui/Skeleton";
import { ApiProductCard } from "@/components/ApiProductCard";
import { Reveal } from "@/components/ui/Reveal";
import { useAuth } from "@/components/auth/AuthProvider";
import { api, ApiError, type ApiProduct } from "@/lib/api";

export default function FavoritesPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [products, setProducts] = useState<ApiProduct[] | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!authLoading && !user) router.replace("/kirish?next=/sevimlilar");
  }, [authLoading, user, router]);

  useEffect(() => {
    if (!user) return;
    api
      .myFavorites()
      .then((data) => setProducts(data.results))
      .catch((err) => {
        setError(err instanceof ApiError ? err.message : "Yuklab bo'lmadi");
        setProducts([]);
      });
  }, [user]);

  if (authLoading || !user) return null;

  return (
    <>
      <PageHeader eyebrow="Profil" title="Sevimlilarim" description="Saqlab qo'ygan mahsulotlaringiz." />

      <Container className="py-10">
        {products === null ? (
          <ul className="grid grid-cols-2 gap-4 lg:grid-cols-4 lg:gap-5">
            {Array.from({ length: 4 }).map((_, i) => (
              <li key={i}>
                <ProductCardSkeleton />
              </li>
            ))}
          </ul>
        ) : error ? (
          <ErrorState message={error} />
        ) : products.length === 0 ? (
          <EmptyState
            icon="♡"
            title="Hozircha bo'sh"
            hint="Yoqqan mahsulotlarni yurak belgisi orqali shu yerga saqlang."
          />
        ) : (
          <ul className="grid grid-cols-2 gap-4 lg:grid-cols-4 lg:gap-5">
            {products.map((product, i) => (
              <li key={product.id}>
                <Reveal delay={Math.min(i, 7) * 0.06}>
                  <ApiProductCard product={product} />
                </Reveal>
              </li>
            ))}
          </ul>
        )}
      </Container>
    </>
  );
}
