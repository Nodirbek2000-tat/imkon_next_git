import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/server/auth";
import { AdminPageClient } from "@/components/admin/AdminPageClient";

// Server Component — kirish huquqi render BOSHLANISHIDAN OLDIN tekshiriladi.
// Admin bo'lmagan (yoki tizimga kirmagan) so'rov haqiqiy HTTP 404 oladi —
// sahifa borligi ham bilinmaydi, client-side redirect'dagidek yarim soniyalik
// yaltirash yo'q.
export default async function AdminPage() {
  const user = await getCurrentUser();
  if (!user?.is_admin) notFound();

  return <AdminPageClient user={user} />;
}
