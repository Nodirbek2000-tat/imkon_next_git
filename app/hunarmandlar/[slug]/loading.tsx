import { PageLoader } from "@/components/ui/Skeleton";

/**
 * Bosilgan zahoti ko'rinadigan ekran.
 *
 * Bu sahifalar serverda har safar qaytadan quriladi (dinamik marshrut),
 * shuning uchun bosish bilan ochilish orasida bir necha soniya o'tardi
 * va brauzer eski sahifada turaverardi — foydalanuvchi bosilmadi deb
 * o'ylab qayta-qayta bosardi. Next shu faylni darhol ko'rsatadi.
 */
export default function Loading() {
  return <PageLoader label="Profil yuklanmoqda" />;
}
