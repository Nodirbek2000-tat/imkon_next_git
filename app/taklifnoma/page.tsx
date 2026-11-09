import type { Metadata } from "next";
import { Invitation } from "@/components/taklifnoma/Invitation";

/**
 * Taklifnoma sahifasi.
 *
 * Havola Telegram va WhatsApp orqali tarqaladi — shuning uchun `openGraph`
 * to'liq to'ldirilgan: xabarda ko'rinadigan sarlavha, matn va rasm shu
 * yerdan olinadi. Rasm manzili ATAYLAB to'liq (https bilan): ulashuvchi
 * dasturlar nisbiy manzilni o'qiy olmaydi.
 */

const TITLE = "Imkon Plus hayriya auksioniga taklifnoma";
const DESCRIPTION =
  "12-noyabr, soat 11:00 — Samarqand Davlat Tibbiyot Universiteti " +
  "ko'p tarmoqli klinikasi, Morfologiya binosi, 1-qavat, faollar zali.";
const IMAGE = "https://imkon-plus.uz/taklifnoma/logo.png";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: "https://imkon-plus.uz/taklifnoma",
    siteName: "Imkon Plus",
    locale: "uz_UZ",
    type: "website",
    images: [{ url: IMAGE, width: 1026, height: 492, alt: "Imkon Plus" }],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: [IMAGE],
  },
};

export default function TaklifnomaPage() {
  return <Invitation />;
}
