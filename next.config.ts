import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /**
   * Docker uchun: Next faqat kerakli fayllarni bitta papkaga yig'adi.
   * Shusiz образga butun `node_modules` tushardi (yuzlab megabayt).
   */
  output: "standalone",
};

export default nextConfig;
