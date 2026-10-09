/**
 * Django API mijozi.
 *
 * Barcha so'rovlar shu saytning o'z `/api/*` Route Handler'lariga (BFF
 * proxy — `app/api/[...path]/route.ts`) boradi, ular esa serverga Djangoga
 * uzatadi. JWT endi bu yerda umuman ko'rinmaydi — httpOnly cookie'da,
 * faqat Next.js server o'qiy oladi (XSS orqali o'g'irlab bo'lmaydi).
 * Cookie brauzer tomonidan avtomatik yuboriladi, qo'shimcha kod kerak emas.
 */

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

/* ------------------------------------------------------------- til */

export const LANGUAGES = [
  { code: "uz", label: "O'zbekcha", short: "UZ" },
  { code: "ru", label: "Русский", short: "RU" },
  { code: "en", label: "English", short: "EN" },
] as const;

export type Lang = (typeof LANGUAGES)[number]["code"];

/**
 * Joriy til. Har so'rovga `?lang=` bo'lib qo'shiladi.
 *
 * Aniq yubormasak backend brauzerning `Accept-Language` sarlavhasini o'qiydi —
 * natijada o'zbek foydalanuvchi ruscha interfeys ko'rib qoladi. Til faqat
 * foydalanuvchi tanlovi bilan belgilanadi.
 */
const LANG_KEY = "imkon-lang";

/**
 * Modul yuklanishidayoq o'qiymar — LangSwitcher'ning useEffect'ini kutsak,
 * sahifa birinchi so'rovni noto'g'ri tilda yuborib ulguradi.
 */
function readStoredLang(): Lang {
  if (typeof window === "undefined") return "uz";
  const saved = localStorage.getItem(LANG_KEY);
  return LANGUAGES.some((l) => l.code === saved) ? (saved as Lang) : "uz";
}

let currentLang: Lang = readStoredLang();

export function setLang(lang: Lang) {
  currentLang = lang;
  if (typeof window !== "undefined") localStorage.setItem(LANG_KEY, lang);
}

export function getLang(): Lang {
  return currentLang;
}

/* ------------------------------------------------------------- so'rov */

type FetchOptions = {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  body?: unknown;
  // Endi faqat hujjatlash uchun — cookie brauzer tomonidan avtomatik
  // yuboriladi, bu bayroq so'rov xatti-harakatini o'zgartirmaydi.
  auth?: boolean;
};

export async function apiFetch<T>(path: string, options: FetchOptions = {}): Promise<T> {
  const { method = "GET", body } = options;

  const headers: Record<string, string> = {};
  const isForm = body instanceof FormData;
  if (body !== undefined && !isForm) headers["Content-Type"] = "application/json";

  // Tilni aniq belgilaymiz — brauzer sarlavhasiga tayanmaymiz. Nisbiy
  // yo'l — shu saytning o'z Route Handler'iga (BFF proxy) boradi.
  const url = new URL(path, window.location.origin);
  if (!url.searchParams.has("lang")) url.searchParams.set("lang", currentLang);

  // Oxiridagi `/` OLIB TASHLANADI. Next'da `trailingSlash: false`
  // (standart qiymat), ya'ni `/api/products/` so'ralsa u avval 308
  // bilan `/api/products` ga yo'naltiradi — HAR BIR so'rov ikki
  // marta ketardi. Serverda bu har safar ~0.4 soniya edi.
  //
  // Django esa `/` bilan tugagan yo'lni kutadi (`APPEND_SLASH`) —
  // uni proxy (`app/api/[...path]/route.ts`) qayta qo'shib beradi,
  // shuning uchun backend tomonida hech narsa o'zgarmaydi.
  if (url.pathname.length > 1 && url.pathname.endsWith("/")) {
    url.pathname = url.pathname.slice(0, -1);
  }

  let response: Response;
  try {
    response = await fetch(url.pathname + url.search, {
      method,
      headers,
      body: body === undefined ? undefined : isForm ? body : JSON.stringify(body),
    });
  } catch {
    throw new ApiError(0, "Server bilan aloqa yo'q. Sahifani yangilab ko'ring.");
  }

  if (!response.ok) {
    let detail = `Xatolik (${response.status})`;
    try {
      const data = await response.json();
      detail =
        data.detail ??
        data.non_field_errors?.[0] ??
        Object.values(data).flat().filter((v) => typeof v === "string")[0] ??
        detail;
    } catch {
      /* JSON bo'lmagan javob */
    }
    throw new ApiError(response.status, String(detail));
  }

  if (response.status === 204) return undefined as T;
  return response.json();
}

/* ------------------------------------------------------------- turlar */

export type Paginated<T> = {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
};

export type ApiUser = {
  id: number;
  /** Maktab va o'quvchi akkauntida raqam YO'Q — `null` keladi. */
  phone: string | null;
  full_name: string;
  avatar: string | null;
  bio: string;
  email: string;
  role: "user" | "artisan" | "school" | "student";
  is_artisan: boolean;
  is_admin: boolean;
  artisan_slug: string | null;
  /** Maktab akkaunti — login/parol bilan kiradi, o'quvchilarini boshqaradi. */
  is_school: boolean;
  /** O'quvchi — maktab kiritgan, o'zi tizimga kirmaydi. */
  is_student: boolean;
  /** Maktabning o'z ommaviy sahifasi (`/maktablar/<slug>`). */
  school_slug: string | null;
  school_name: string | null;
  language: string;
  is_phone_verified: boolean;
  created_at: string;
  has_google: boolean;
  has_telegram: boolean;
  telegram_username: string;
  has_password: boolean;
};

export type ApiCategory = {
  id: number;
  slug: string;
  name: string;
  icon: string;
  parent: number | null;
};

export type ApiCraft = { id: number; slug: string; name: string; icon: string };

export type ApiImage = { url: string; alt: string } | null;

export type ApiProduct = {
  id: number;
  slug: string;
  title: string;
  price: string;
  sale_type: "fixed" | "auction";
  status: string;
  artisan: {
    id: number;
    slug: string;
    shop_name: string;
    region: string;
    /** `"student"` — maktab o'quvchisining ishi. */
    kind: "artisan" | "student";
  };
  category: ApiCategory;
  main_image: ApiImage;
  /** Karta ustida sichqoncha yurganda almashadigan rasmlar (eng ko'pi 4 ta). */
  gallery: { url: string; alt: string }[];
  stock: number;
  has_auction: boolean;
  created_at: string;
  rating_avg: number | null;
  rating_count: number;
  is_favorited: boolean;
};

export type ApiProductDetail = ApiProduct & {
  description: string;
  images: { id: number; image: string; alt_text: string; is_main: boolean }[];
  features: { name: string; value: string }[];
  stock: number;
  views_count: number;
  auction_id: number | null;
};

export type ApiBid = { id: number; amount: string; user_name: string; created_at: string };

export type ApiAuction = {
  id: number;
  /** Ro'yxatda qisqa, lot sahifasida to'liq — `ApiAuctionDetail`ga qarang. */
  product: ApiProduct;
  start_price: string;
  current_price: string;
  min_increment: string;
  next_min_bid: string;
  start_at: string;
  end_at: string;
  seconds_left: number;
  status: "pending" | "live" | "ended" | "cancelled";
  is_live: boolean;
  bids_count: number;
};

export type ApiAuctionDetail = Omit<ApiAuction, "product"> & {
  /** Lot sahifasida mahsulot to'liq keladi: barcha rasmlar, tavsif, xususiyatlar. */
  product: ApiProductDetail;
  bids: ApiBid[];
  my_max_bid: string | null;
  winner: number | null;
};

export type ApiArtisan = {
  id: number;
  slug: string;
  shop_name: string;
  user: { id: number; full_name: string; avatar: string | null; bio: string; role: string };
  crafts: ApiCraft[];
  region: string;
  banner: string | null;
  /** `"student"` — bu maktab o'quvchisi, oddiy hunarmand emas. */
  kind: "artisan" | "student";
  products_count: number;
  posts_count: number;
  sold_count: number;
  created_at: string;
};

/** O'quvchi sahifasida ko'rinadigan maktab — bosilsa maktab sahifasiga boradi. */
export type ApiArtisanSchool = {
  slug: string;
  name: string;
  logo: string | null;
  region: string;
  district: string;
};

export type ApiArtisanDetail = ApiArtisan & {
  about: string;
  /** Oddiy hunarmandda `null`, o'quvchida — uning maktabi. */
  school: ApiArtisanSchool | null;
  student_grade: string;
};

/* --- maktablar --- */

/** Maktab o'quvchisi — maktab paneli va maktab sahifasida ko'rinadi. */
export type ApiStudent = {
  id: number;
  slug: string;
  full_name: string;
  avatar: string | null;
  student_grade: string;
  products_count: number;
  sold_count: number;
  is_active: boolean;
  created_at: string;
};

export type ApiSchool = {
  id: number;
  slug: string;
  name: string;
  region: string;
  district: string;
  logo: string | null;
  banner: string | null;
  students_count: number;
  created_at: string;
};

export type ApiSchoolDetail = ApiSchool & {
  about: string;
  contact_phone: string;
  students: ApiStudent[];
};

/** `/api/school/me/` — maktab o'z sahifasini tahrirlaydi (xom tarjima maydonlari). */
export type ApiMySchool = {
  id: number;
  slug: string;
  /** Faqat o'qish uchun — loginni admin beradi, maktab o'zgartira olmaydi. */
  login: string;
  name_uz: string;
  name_ru: string;
  name_en: string;
  about_uz: string;
  about_ru: string;
  about_en: string;
  region: string;
  district: string;
  contact_phone: string;
  logo: string | null;
  banner: string | null;
  students_count: number;
};

/** `MyShopView` (`/api/shop/me/`) — hunarmandning o'z do'konini tahrirlashi */
export type ApiShop = {
  shop_name_uz: string;
  shop_name_ru: string;
  shop_name_en: string;
  about_uz: string;
  about_ru: string;
  about_en: string;
  crafts: number[];
  region: string;
  banner: string | null;
};

export type ApiPost = {
  id: number;
  caption: string;
  images: { id: number; image: string; order: number }[];
  product: number | null;
  artisan_slug: string;
  artisan_name: string;
  artisan_avatar: string | null;
  likes_count: number;
  is_liked: boolean;
  created_at: string;
};

export type ApiApplication = {
  id: number;
  shop_name: string;
  craft: number;
  description: string;
  region: string;
  status: "pending" | "approved" | "rejected";
  admin_note: string;
  created_at: string;
};

export type ApiComment = {
  id: number;
  text: string;
  rating: number | null;
  parent: number | null;
  user_name: string;
  user_avatar: string | null;
  is_mine: boolean;
  replies: ApiComment[];
  created_at: string;
  product_slug: string;
  product_title: string;
  product_image: string | null;
};

export type ApiMyStats = {
  products_total: number;
  products_active: number;
  products_sold: number;
  revenue_total: string | number;
  sold_this_month: number;
  revenue_this_month: string | number;
};

export type ApiNotification = {
  id: number;
  type:
    | "application_approved"
    | "application_rejected"
    | "new_comment"
    | "order_placed"
    | "new_order";
  title: string;
  body: string;
  link_url: string;
  is_read: boolean;
  created_at: string;
};

export type ApiCartItem = {
  id: number;
  product: ApiProduct;
  quantity: number;
  subtotal: string;
  created_at: string;
};

export type ApiOrderItem = {
  id: number;
  title: string;
  price: string;
  quantity: number;
  subtotal: string;
  product_slug: string | null;
};

/**
 * To'lov holati. `null` — chek umuman yuborilmagan.
 *
 * Buyurtma holati bilan aralashtirmang: `status: "pending"` bo'lgan
 * buyurtma "hali hech narsa qilmadi" ham, "cheki tekshirilmoqda" ham
 * bo'lishi mumkin.
 */
export type PaymentStatus =
  | "awaiting_receipt"
  | "pending"
  | "approved"
  | "rejected";

export type ApiOrder = {
  id: number;
  order_number: string;
  full_name: string;
  phone: string;
  address: string;
  total: string;
  status: "pending" | "paid" | "cancelled";
  payment_status: PaymentStatus | null;
  reject_reason: string;
  items: ApiOrderItem[];
  created_at: string;
};

/* --- balans (hunarmandlar uchun) --- */

export type ApiBalance = {
  amount: string;
  commission_percent: number;
  updated_at: string;
};

export type ApiBalanceTransaction = {
  id: number;
  type: "sale" | "withdrawal" | "adjustment";
  type_display: string;
  order_number: string | null;
  gross_amount: string;
  commission_amount: string;
  amount: string;
  balance_after: string;
  comment: string;
  created_at: string;
};

/* --- admin panel --- */

export type AdminUser = {
  id: number;
  phone: string | null;
  full_name: string;
  avatar: string | null;
  role: "user" | "artisan" | "school" | "student";
  is_admin: boolean;
  is_active: boolean;
  is_phone_verified: boolean;
  artisan_slug: string | null;
  created_at: string;
};

export type AdminApplication = {
  id: number;
  user: AdminUser;
  shop_name: string;
  craft: number;
  craft_name: string;
  description: string;
  region: string;
  document: string | null;
  status: "pending" | "approved" | "rejected";
  admin_note: string;
  created_at: string;
  reviewed_at: string | null;
};

export type AdminAuction = {
  id: number;
  product_title: string;
  artisan_name: string;
  start_price: string;
  current_price: string;
  bids_count: number;
  start_at: string;
  end_at: string;
  seconds_left: number;
  status: "pending" | "live" | "ended" | "cancelled";
  winner_name: string | null;
};

/** To'lov kartasi — bot xaridorga shu kartani ko'rsatadi. */
export type AdminPaymentCard = {
  id: number;
  number: string;
  holder_name: string;
  bank: string;
  note: string;
  is_active: boolean;
  payments_count: number;
  created_at: string;
};

/** Auksionga qo'yish mumkin bo'lgan mahsulot (admin tanlaydi). */
export type AuctionCandidate = {
  id: number;
  slug: string;
  title_uz: string;
  price: string;
  artisan_name: string;
  image: string | null;
};

export type AuctionCreateBody = {
  product: string; // slug
  start_price: string;
  min_increment: string;
  start_at: string; // ISO
  end_at: string; // ISO
};

/**
 * Admin ko'radigan maktab.
 *
 * `password` bu yerda YO'Q — u faqat ochish va parol yangilash javobida
 * bir marta qaytadi (`AdminSchoolCreated`), bazada esa hash saqlanadi.
 */
export type AdminSchool = {
  id: number;
  slug: string;
  login: string;
  name_uz: string;
  name_ru: string;
  name_en: string;
  about_uz: string;
  about_ru: string;
  about_en: string;
  region: string;
  district: string;
  contact_phone: string;
  logo: string | null;
  banner: string | null;
  students_count: number;
  is_active: boolean;
  /** `user.is_active` — maktab tizimga kira oladimi. */
  can_login: boolean;
  created_at: string;
};

/** Maktab ochilgandagi javob — parol shu yerda BIR MARTA ko'rinadi. */
export type AdminSchoolCreated = {
  detail: string;
  school: AdminSchool;
  login: string;
  password: string;
};

export type AdminSchoolPassword = {
  detail: string;
  login: string;
  password: string;
};

export type AdminSchoolCreateBody = {
  login: string;
  name_uz: string;
  /** Bo'sh qoldirilsa backend o'zi yaratadi. */
  password?: string;
  region?: string;
  district?: string;
  contact_phone?: string;
  about_uz?: string;
};

export type AdminStats = {
  users_total: number;
  users_new_week: number;
  artisans_total: number;
  admins_total: number;
  schools_total: number;
  students_total: number;
  applications_pending: number;
  applications_total: number;
  products_total: number;
  products_active: number;
  auctions_live: number;
  auctions_total: number;
  bids_total: number;
};

/* ------------------------------------------------------------- endpointlar */

export const api = {
  // auth
  sendOtp: (phone: string) =>
    apiFetch<{ detail: string; expires_in: number }>("/api/auth/otp/send/", {
      method: "POST",
      body: { phone },
    }),

  verifyOtp: (phone: string, code: string, full_name?: string) =>
    apiFetch<{ user: ApiUser; is_new: boolean }>("/api/auth/otp/verify/", {
      method: "POST",
      body: { phone, code, full_name },
    }),

  googleLogin: (credential: string) =>
    apiFetch<{ user: ApiUser; is_new: boolean; needs_phone: boolean }>("/api/auth/google/", {
      method: "POST",
      body: { credential },
    }),

  telegramLogin: (code: string) =>
    apiFetch<{ user: ApiUser; is_new: boolean }>("/api/auth/telegram/verify/", {
      method: "POST",
      body: { code },
    }),

  passwordLogin: (phone: string, password: string) =>
    apiFetch<{ user: ApiUser; is_new: boolean }>("/api/auth/password/", {
      method: "POST",
      body: { phone, password },
    }),

  /**
   * Maktab kirishi. `passwordLogin`dan farqi — telefon emas, login.
   * Maktab akkauntida raqam umuman yo'q, uni admin login/parol bilan ochadi.
   */
  schoolLogin: (login: string, password: string) =>
    apiFetch<{ user: ApiUser; is_new: boolean }>("/api/auth/school/", {
      method: "POST",
      body: { login, password },
    }),

  setPassword: (password: string) =>
    apiFetch<ApiUser>("/api/auth/password/set/", {
      method: "POST",
      body: { password },
      auth: true,
    }),

  logout: () => apiFetch<{ detail: string }>("/api/auth/logout/", { method: "POST" }),

  me: () => apiFetch<ApiUser>("/api/auth/me/", { auth: true }),

  updateMe: (body: FormData | Record<string, unknown>) =>
    apiFetch<ApiUser>("/api/auth/me/", { method: "PATCH", body, auth: true }),

  linkGoogle: (credential: string) =>
    apiFetch<ApiUser>("/api/auth/google/link/", { method: "POST", body: { credential }, auth: true }),

  linkTelegram: (code: string) =>
    apiFetch<ApiUser>("/api/auth/telegram/link/", { method: "POST", body: { code }, auth: true }),

  // savat
  cart: () => apiFetch<ApiCartItem[]>("/api/cart/", { auth: true }),

  addToCart: (productSlug: string, quantity = 1) =>
    apiFetch<ApiCartItem>("/api/cart/", {
      method: "POST",
      body: { product: productSlug, quantity },
      auth: true,
    }),

  updateCartItem: (id: number, quantity: number) =>
    apiFetch<ApiCartItem>(`/api/cart/${id}/`, {
      method: "PATCH",
      body: { quantity },
      auth: true,
    }),

  removeCartItem: (id: number) =>
    apiFetch<void>(`/api/cart/${id}/`, { method: "DELETE", auth: true }),

  // buyurtma
  myOrders: () => apiFetch<Paginated<ApiOrder>>("/api/orders/", { auth: true }),

  checkout: (body: { full_name: string; phone: string; address: string }) =>
    apiFetch<ApiOrder>("/api/orders/", { method: "POST", body, auth: true }),

  cancelOrder: (id: number) =>
    apiFetch<ApiOrder>(`/api/orders/${id}/cancel/`, { method: "POST", auth: true }),

  // balans
  myBalance: () => apiFetch<ApiBalance>("/api/balance/", { auth: true }),

  balanceTransactions: () =>
    apiFetch<Paginated<ApiBalanceTransaction>>("/api/balance/transactions/", {
      auth: true,
    }),

  // sevimlilar
  toggleFavorite: (slug: string) =>
    apiFetch<{ favorited: boolean }>(`/api/products/${slug}/favorite/`, {
      method: "POST",
      auth: true,
    }),

  myFavorites: () =>
    apiFetch<Paginated<ApiProduct>>("/api/products/my-favorites/", { auth: true }),

  // katalog
  categories: () => apiFetch<ApiCategory[]>("/api/categories/"),

  products: (params: Record<string, string> = {}) =>
    apiFetch<Paginated<ApiProduct>>(`/api/products/?${new URLSearchParams(params)}`),

  // `lang` berilsa joriy interfeys tili o'rniga o'sha til so'raladi —
  // tahrirlash formasi doim o'zbekcha (asl) matnni oladi
  product: (slug: string, lang?: Lang) =>
    apiFetch<ApiProductDetail>(`/api/products/${slug}/${lang ? `?lang=${lang}` : ""}`),

  // auksion
  auctions: (live = false) =>
    apiFetch<Paginated<ApiAuction>>(`/api/auctions/${live ? "?live=1" : ""}`),

  auction: (id: string | number) => apiFetch<ApiAuctionDetail>(`/api/auctions/${id}/`),

  placeBid: (id: string | number, body: { amount?: string; increment?: boolean }) =>
    apiFetch<{ current_price: string; next_min_bid: string; end_at: string; bids_count: number }>(
      `/api/auctions/${id}/bid/`,
      { method: "POST", body, auth: true },
    ),

  // hunarmandlar
  artisans: (params: Record<string, string> = {}) =>
    apiFetch<Paginated<ApiArtisan>>(`/api/artisans/?${new URLSearchParams(params)}`),

  artisan: (slug: string) => apiFetch<ApiArtisanDetail>(`/api/artisans/${slug}/`),

  posts: (artisanSlug?: string) =>
    apiFetch<Paginated<ApiPost>>(
      `/api/posts/${artisanSlug ? `?artisan=${artisanSlug}` : ""}`,
      { auth: true },
    ),

  createPost: (form: FormData) =>
    apiFetch<ApiPost>("/api/posts/", { method: "POST", body: form, auth: true }),

  likePost: (id: number) =>
    apiFetch<{ liked: boolean }>(`/api/posts/${id}/like/`, { method: "POST", auth: true }),

  // do'kon ochish
  crafts: () => apiFetch<ApiCraft[]>("/api/crafts/"),

  myApplications: () =>
    apiFetch<Paginated<ApiApplication>>("/api/shop/apply/", { auth: true }),

  applyShop: (form: FormData) =>
    apiFetch<ApiApplication>("/api/shop/apply/", { method: "POST", body: form, auth: true }),

  myShop: () => apiFetch<ApiShop>("/api/shop/me/", { auth: true }),

  updateMyShop: (form: FormData) =>
    apiFetch<ApiShop>("/api/shop/me/", { method: "PATCH", body: form, auth: true }),

  /* --- maktablar (ommaviy) --- */

  schools: (params: Record<string, string> = {}) =>
    apiFetch<Paginated<ApiSchool>>(`/api/schools/?${new URLSearchParams(params)}`),

  school: (slug: string) => apiFetch<ApiSchoolDetail>(`/api/schools/${slug}/`),

  /* --- maktabning o'z paneli --- */

  // Diqqat: `school/` birlikda — ommaviy `schools/` dan boshqa manzil.
  mySchool: () => apiFetch<ApiMySchool>("/api/school/me/", { auth: true }),

  updateMySchool: (body: FormData | Record<string, unknown>) =>
    apiFetch<ApiMySchool>("/api/school/me/", { method: "PATCH", body, auth: true }),

  /** Maktabning o'z o'quvchilari. Sahifalanmagan — to'g'ridan-to'g'ri massiv. */
  mySchoolStudents: () => apiFetch<ApiStudent[]>("/api/school/students/", { auth: true }),

  /** O'quvchi qo'shish — tasdiqlash yo'q, darhol paydo bo'ladi. */
  createStudent: (body: FormData | Record<string, unknown>) =>
    apiFetch<ApiStudent>("/api/school/students/", { method: "POST", body, auth: true }),

  updateStudent: (slug: string, body: FormData | Record<string, unknown>) =>
    apiFetch<ApiStudent>(`/api/school/students/${slug}/`, {
      method: "PATCH",
      body,
      auth: true,
    }),

  // mahsulot boshqaruvi (hunarmand)
  createProduct: (form: FormData) =>
    apiFetch<{ id: number; slug: string }>("/api/products/", {
      method: "POST",
      body: form,
      auth: true,
    }),

  updateProduct: (slug: string, body: FormData | Record<string, unknown>) =>
    apiFetch<{ id: number; slug: string }>(`/api/products/${slug}/`, {
      method: "PATCH",
      body,
      auth: true,
    }),

  deleteProduct: (slug: string) =>
    apiFetch<void>(`/api/products/${slug}/`, { method: "DELETE", auth: true }),

  myProducts: () =>
    apiFetch<Paginated<ApiProduct>>("/api/products/?mine=1", { auth: true }),

  myComments: () =>
    apiFetch<Paginated<ApiComment>>("/api/products/my-comments/", { auth: true }),

  myWrittenComments: () =>
    apiFetch<Paginated<ApiComment>>("/api/products/my-written-comments/", { auth: true }),

  myStats: () => apiFetch<ApiMyStats>("/api/products/my-stats/", { auth: true }),

  // bildirishnomalar
  notifications: (unread = false) =>
    apiFetch<Paginated<ApiNotification> & { unread_count: number }>(
      `/api/notifications/${unread ? "?unread=1" : ""}`,
      { auth: true },
    ),

  markNotificationRead: (id: number) =>
    apiFetch<{ detail: string }>(`/api/notifications/${id}/read/`, {
      method: "POST",
      auth: true,
    }),

  markAllNotificationsRead: () =>
    apiFetch<{ detail: string }>("/api/notifications/read-all/", {
      method: "POST",
      auth: true,
    }),

  // izohlar
  comments: (slug: string) =>
    apiFetch<Paginated<ApiComment>>(`/api/products/${slug}/comments/`, {
      auth: true,
    }),

  addComment: (slug: string, text: string, parent?: number, rating?: number) =>
    apiFetch<ApiComment>(`/api/products/${slug}/comments/`, {
      method: "POST",
      body: { text, parent, rating },
      auth: true,
    }),

  deleteComment: (slug: string, id: number) =>
    apiFetch<void>(`/api/products/${slug}/comments/${id}/`, {
      method: "DELETE",
      auth: true,
    }),
};

/* ------------------------------------------------------------- admin API */

export const adminApi = {
  stats: () => apiFetch<AdminStats>("/api/admin-panel/stats/", { auth: true }),

  users: (params: Record<string, string> = {}) =>
    apiFetch<Paginated<AdminUser>>(
      `/api/admin-panel/users/?${new URLSearchParams(params)}`,
      { auth: true },
    ),

  toggleAdmin: (id: number) =>
    apiFetch<{ detail: string; user: AdminUser }>(
      `/api/admin-panel/users/${id}/toggle-admin/`,
      { method: "POST", auth: true },
    ),

  toggleActive: (id: number) =>
    apiFetch<{ detail: string; user: AdminUser }>(
      `/api/admin-panel/users/${id}/toggle-active/`,
      { method: "POST", auth: true },
    ),

  applications: (status?: string) =>
    apiFetch<Paginated<AdminApplication>>(
      `/api/admin-panel/applications/${status ? `?status=${status}` : ""}`,
      { auth: true },
    ),

  approveApplication: (id: number, note = "") =>
    apiFetch<{ detail: string; artisan_slug: string }>(
      `/api/admin-panel/applications/${id}/approve/`,
      { method: "POST", body: { note }, auth: true },
    ),

  rejectApplication: (id: number, note = "") =>
    apiFetch<{ detail: string }>(`/api/admin-panel/applications/${id}/reject/`, {
      method: "POST",
      body: { note },
      auth: true,
    }),

  auctions: () =>
    apiFetch<Paginated<AdminAuction>>("/api/admin-panel/auctions/", { auth: true }),

  // to'lov kartalari
  cards: () =>
    apiFetch<AdminPaymentCard[]>("/api/admin-panel/cards/", { auth: true }),

  addCard: (body: { number: string; holder_name: string; bank?: string; note?: string }) =>
    apiFetch<AdminPaymentCard>("/api/admin-panel/cards/", {
      method: "POST",
      body,
      auth: true,
    }),

  activateCard: (id: number) =>
    apiFetch<{ detail: string; card: AdminPaymentCard }>(
      `/api/admin-panel/cards/${id}/activate/`,
      { method: "POST", auth: true },
    ),

  deactivateCard: (id: number) =>
    apiFetch<{ detail: string; has_active: boolean; card: AdminPaymentCard }>(
      `/api/admin-panel/cards/${id}/deactivate/`,
      { method: "POST", auth: true },
    ),

  auctionCandidates: (search?: string) =>
    apiFetch<Paginated<AuctionCandidate>>(
      `/api/admin-panel/auctions/candidates/${search ? `?search=${encodeURIComponent(search)}` : ""}`,
      { auth: true },
    ),

  createAuction: (body: AuctionCreateBody) =>
    apiFetch<AdminAuction>("/api/admin-panel/auctions/create/", {
      method: "POST",
      body,
      auth: true,
    }),

  finalizeAuction: (id: number) =>
    apiFetch<{ detail: string }>(`/api/admin-panel/auctions/${id}/finalize/`, {
      method: "POST",
      auth: true,
    }),

  cancelAuction: (id: number) =>
    apiFetch<{ detail: string }>(`/api/admin-panel/auctions/${id}/cancel/`, {
      method: "POST",
      auth: true,
    }),

  /* --- maktablar --- */

  // Sahifalanmagan — maktablar soni ko'p bo'lmaydi
  schools: (params: Record<string, string> = {}) =>
    apiFetch<AdminSchool[]>(
      `/api/admin-panel/schools/?${new URLSearchParams(params)}`,
      { auth: true },
    ),

  /** Maktab ochadi va login/parolni qaytaradi — parol faqat shu javobda. */
  createSchool: (body: AdminSchoolCreateBody) =>
    apiFetch<AdminSchoolCreated>("/api/admin-panel/schools/", {
      method: "POST",
      body,
      auth: true,
    }),

  updateSchool: (id: number, body: FormData | Record<string, unknown>) =>
    apiFetch<AdminSchool>(`/api/admin-panel/schools/${id}/`, {
      method: "PATCH",
      body,
      auth: true,
    }),

  schoolStudents: (id: number) =>
    apiFetch<ApiStudent[]>(`/api/admin-panel/schools/${id}/students/`, { auth: true }),

  /** Yangi parol. `password` berilmasa backend o'zi yaratadi. */
  resetSchoolPassword: (id: number, password?: string) =>
    apiFetch<AdminSchoolPassword>(`/api/admin-panel/schools/${id}/password/`, {
      method: "POST",
      body: { password: password ?? "" },
      auth: true,
    }),

  /** Maktabni yoqadi/o'chiradi — sahifa ham, login ham birga. */
  toggleSchoolActive: (id: number) =>
    apiFetch<{ detail: string; school: AdminSchool }>(
      `/api/admin-panel/schools/${id}/toggle-active/`,
      { method: "POST", auth: true },
    ),
};
