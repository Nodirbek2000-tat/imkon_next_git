/**
 * Vaqtinchalik ma'lumot. Backend tayyor bo'lgach `lib/api.ts` bilan almashtiriladi.
 * Shakl API javobiga mos — almashtirish oson bo'lsin uchun.
 */

export type Product = {
  id: string;
  slug: string;
  title: string;
  description: string;
  price: number;
  category: string;
  seller: { name: string; region: string; craft: string };
  /**
   * Mahsulot rasmi (`public/mahsulotlar/…`). Bo'lmasa `art` gradienti
   * chiziladi — bitta rasm yetishmagani uchun butun bo'lim buzilmasin.
   */
  image?: string;
  /** Rasm yo'q bo'lgandagi zaxira gradient */
  art: { from: string; to: string; shape: "arc" | "grid" | "wave" | "bloom" };
};

export type Auction = Product & {
  currentPrice: number;
  startPrice: number;
  bidsCount: number;
  endAt: Date;
};

export type EventItem = {
  id: string;
  title: string;
  date: string;
  day: string;
  month: string;
  time: string;
  location: string;
  kind: "auksion" | "yarmarka" | "ko'rgazma";
};

export const categories = [
  "Rassomlik",
  "To'qimachilik",
  "Yog'och o'ymakorligi",
  "Kulolchilik",
  "Zargarlik",
  "O'yinchoqlar",
  "Misgarlik",
  "To'quv buyumlar",
];

export const products: Product[] = [
  {
    id: "1",
    slug: "kuzgi-tabiat-manzarasi",
    image: "/mahsulotlar/kuzgi-tabiat-manzarasi.jpg",
    title: "Kuzgi tabiat manzarasi",
    description: "Akvarel bo'yoqlari yordamida chizilgan yorqin kuz manzarasi.",
    price: 85_000,
    category: "Rassomlik",
    seller: { name: "Dilnoza Karimova", region: "Toshkent", craft: "Rassom" },
    art: { from: "#f0334d", to: "#d99a2b", shape: "arc" },
  },
  {
    id: "2",
    slug: "yumshoq-ayircha",
    image: "/mahsulotlar/yumshoq-ayiqcha.jpg",
    title: "Yumshoq ayiqcha",
    description: "Qo'lda to'qilgan, yuvishga chidamli yumshoq o'yinchoq.",
    price: 45_000,
    category: "O'yinchoqlar",
    seller: { name: "Nilufar Ahmedova", region: "Samarqand", craft: "To'quvchi" },
    art: { from: "#b9122c", to: "#fb6478", shape: "bloom" },
  },
  {
    id: "3",
    slug: "qolda-ishlangan-bilaguzuk",
    image: "/mahsulotlar/qolda-ishlangan-bilaguzuk.jpg",
    title: "Qo'lda ishlangan bilaguzuk",
    description: "Tabiiy toshlardan yasalgan chiroyli munchoqlar jamlanmasi.",
    price: 75_000,
    category: "Zargarlik",
    seller: { name: "Aziz Rahimov", region: "Buxoro", craft: "Zargar" },
    art: { from: "#490611", to: "#f0334d", shape: "grid" },
  },
  {
    id: "4",
    slug: "yogoch-oymakorlik-laukha",
    image: "/mahsulotlar/yogoch-oymakorlik-lavhasi.jpg",
    title: "Yog'och o'ymakorlik lavhasi",
    description: "Yong'oq yog'ochidan qo'lda o'yilgan an'anaviy naqsh.",
    price: 145_000,
    category: "Yog'och o'ymakorligi",
    seller: { name: "Sardor To'xtayev", region: "Xiva", craft: "O'ymakor" },
    art: { from: "#a06d14", to: "#f1cd7e", shape: "wave" },
  },
  {
    id: "5",
    slug: "sopol-choynak",
    image: "/mahsulotlar/sopol-choynak.jpg",
    title: "Sopol choynak",
    description: "Rishton uslubidagi qo'lda bo'yalgan kulolchilik buyumi.",
    price: 65_000,
    category: "Kulolchilik",
    seller: { name: "Malika Yusupova", region: "Farg'ona", craft: "Kulol" },
    art: { from: "#dc1b38", to: "#831528", shape: "bloom" },
  },
  {
    id: "6",
    slug: "gilam-toqima-panno",
    image: "/mahsulotlar/gilam-toqima-panno.jpg",
    title: "Gilam to'qima panno",
    description: "Tabiiy jun iplardan to'qilgan devoriy bezak.",
    price: 190_000,
    category: "To'qimachilik",
    seller: { name: "Zulfiya Nazarova", region: "Namangan", craft: "To'quvchi" },
    art: { from: "#9a1329", to: "#d99a2b", shape: "grid" },
  },
  {
    id: "7",
    slug: "chust-doppi",
    image: "/mahsulotlar/doppi.jpg",
    title: "Chust do'ppisi",
    description: "Qora baxmalga oq ipak bilan qo'lda tikilgan an'anaviy do'ppi.",
    price: 55_000,
    category: "To'qimachilik",
    seller: { name: "Gulnora Sobirova", region: "Namangan", craft: "Kashtachi" },
    art: { from: "#490611", to: "#9a1329", shape: "grid" },
  },
  {
    id: "8",
    slug: "suzani-panno",
    image: "/mahsulotlar/suzani.jpg",
    title: "Suzani devoriy panno",
    description: "Ipak iplar bilan qo'lda kashta qilingan an'anaviy suzani.",
    price: 240_000,
    category: "To'qimachilik",
    seller: { name: "Ra'no Qodirova", region: "Buxoro", craft: "Kashtachi" },
    art: { from: "#b9122c", to: "#f0334d", shape: "bloom" },
  },
  {
    id: "9",
    slug: "mis-choydish",
    image: "/mahsulotlar/mis-choydish.jpg",
    title: "Mis choydish",
    description: "Qo'lda bolg'alangan va naqshlangan mis idish.",
    price: 130_000,
    category: "Misgarlik",
    seller: { name: "Anvar Yo'ldoshev", region: "Buxoro", craft: "Misgar" },
    art: { from: "#a06d14", to: "#f1cd7e", shape: "arc" },
  },
  {
    id: "10",
    slug: "qolda-toqilgan-savat",
    image: "/mahsulotlar/savat.jpg",
    title: "Qo'lda to'qilgan savat",
    description: "Tabiiy tol novdalaridan to'qilgan mustahkam savat.",
    price: 40_000,
    category: "To'quv buyumlar",
    seller: { name: "Shuhrat Ergashev", region: "Xorazm", craft: "Savatchi" },
    art: { from: "#d99a2b", to: "#f1cd7e", shape: "wave" },
  },
];

const hours = (n: number) => new Date(Date.now() + n * 3_600_000);

export const auctions: Auction[] = [
  {
    ...products[3],
    id: "a1",
    startPrice: 90_000,
    currentPrice: 145_000,
    bidsCount: 17,
    endAt: hours(5.5),
  },
  {
    ...products[5],
    id: "a2",
    startPrice: 120_000,
    currentPrice: 190_000,
    bidsCount: 31,
    endAt: hours(29),
  },
  {
    // `currentPrice` doim `startPrice` dan yuqori bo'lishi shart — karta
    // ikkalasidan o'sish foizini hisoblaydi, teskarisi bo'lsa manfiy chiqadi
    ...products[4],
    id: "a3",
    startPrice: 40_000,
    currentPrice: 78_000,
    bidsCount: 9,
    endAt: hours(74),
  },
];

export const events: EventItem[] = [
  {
    id: "e1",
    title: "Bahoriy ijod auksioni",
    date: "25-iyun",
    day: "25",
    month: "IYUN",
    time: "14:00",
    location: "Toshkent, Yoshlar markazi",
    kind: "auksion",
  },
  {
    id: "e2",
    title: "Xayriya yarmarkasi va auksion",
    date: "10-iyul",
    day: "10",
    month: "IYUL",
    time: "10:00",
    location: "Xalqaro Hamkorlik Markazi",
    kind: "yarmarka",
  },
  {
    id: "e3",
    title: "Hunarmandlar ko'rgazmasi",
    date: "2-avgust",
    day: "02",
    month: "AVG",
    time: "11:00",
    location: "Samarqand, Registon maydoni",
    kind: "ko'rgazma",
  },
];

export const sponsors = [
  "Ezgu Amal",
  "Mehr Nuri",
  "UzTech",
  "Barkamol Avlod",
  "Hamkor Bank",
  "Zamin",
];

export const stats = [
  { value: "240+", label: "Hunarmand" },
  { value: "1 800+", label: "Sotilgan ish" },
  { value: "12", label: "Viloyat" },
  { value: "96%", label: "Mamnun xaridor" },
];
