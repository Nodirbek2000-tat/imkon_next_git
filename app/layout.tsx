import type { Metadata } from "next";
import Script from "next/script";
import { Geist, Geist_Mono, Bricolage_Grotesque } from "next/font/google";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { CartProvider } from "@/components/cart/CartProvider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Sarlavhalar uchun — o'ziga xos, keng tarqalgan shriftlarga o'xshamaydi
const bricolage = Bricolage_Grotesque({
  variable: "--font-bricolage",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Imkon — hunarmandchilik auksioni va savdo maydoni",
    template: "%s · Imkon",
  },
  description:
    "Imkoniyati cheklangan hunarmandlarning qo'l mehnatini sotib oling yoki auksionda taklif qiling. Iqtidorlar cheksizdir.",
  keywords: ["hunarmandchilik", "auksion", "qo'l mehnati", "Imkon", "O'zbekiston"],
  openGraph: {
    title: "Imkon — iqtidorlar cheksizdir",
    description:
      "Imkoniyati cheklangan hunarmandlarning ijod mahsulotlari uchun onlayn auksion va savdo platformasi.",
    locale: "uz_UZ",
    type: "website",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="uz"
      // Default kechki rejim. suppressHydrationWarning — quyidagi skript
      // data-theme'ni React'dan oldin o'zgartirishi mumkin, bu xato emas.
      data-theme="dark"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} ${bricolage.variable} h-full`}
    >
      <body className="flex min-h-full flex-col">
        {/* Sahifa chizilishidan OLDIN saqlangan temani qo'llaymiz — aks holda
            kunduzgi rejim tanlaganlar bir lahza qorong'i ko'radi.
            `beforeInteractive` skriptni <head>ga joylaydi va React'dan oldin
            ishga tushiradi (oddiy <script> React 19'da ogohlantirish beradi). */}
        <Script id="theme-init" strategy="beforeInteractive">
          {`try{var t=localStorage.getItem("imkon-theme");if(t==="light")document.documentElement.dataset.theme="light"}catch(e){}`}
        </Script>

        <AuthProvider>
          <CartProvider>
            <Header />
            <main id="main" className="flex-1">
              {children}
            </main>
            <Footer />
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
