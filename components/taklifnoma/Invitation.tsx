"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion, type Variants } from "motion/react";
import { Countdown } from "@/components/Countdown";

/**
 * Taklifnoma — "Imkon Plus" hayriya auksioni.
 *
 * Ikki bosqich: avval YOPIQ KONVERT turadi, bosilgach qopqog'i ochilib
 * ichidan xat ko'tariladi va taklifnoma chiziladi. Shunchaki sahifa
 * ochilib qolgandan ko'ra, mehmon o'zi "ochgani" esda qoladi.
 *
 * Logotip fayllari OQ fonli (shaffof emas), shuning uchun taklifnoma oq
 * "qog'oz" karta ko'rinishida: qorong'i fonga to'g'ridan-to'g'ri qo'yilsa
 * logotipdagi qora "PLUS" yozuvi yo'qolib ketardi.
 */

/** Tadbir vaqti — O'zbekiston (UTC+5). Taymer shunga qarab sanaydi. */
const EVENT_AT = "2026-11-12T11:00:00+05:00";

const ADDRESS =
  "Samarqand Davlat Tibbiyot Universiteti Ko'p tarmoqli klinikasi, " +
  "Morfologiya binosi, 1-qavat, faollar zali";

/**
 * Fon zarralari va konfetti.
 *
 * Qiymatlar `Math.random()` bilan emas, indeksdan hisoblanadi: server va
 * brauzer bir xil natija chizishi kerak, aks holda React hydration
 * xatosini beradi va butun sahifa qaytadan chiziladi.
 */
function seeded(index: number, shift: number, range: number) {
  const hash = (index * 2654435761) >>> 0;
  return (hash >>> shift) % range;
}

const SPARKS = Array.from({ length: 22 }, (_, i) => ({
  left: seeded(i, 0, 100),
  delay: seeded(i, 7, 70) / 10,
  duration: 9 + seeded(i, 13, 80) / 10,
  size: 2 + seeded(i, 19, 4),
}));

const CONFETTI = Array.from({ length: 34 }, (_, i) => ({
  left: seeded(i + 100, 0, 100),
  delay: seeded(i + 100, 7, 14) / 10,
  duration: 2.8 + seeded(i + 100, 13, 24) / 10,
  rotate: seeded(i + 100, 19, 360),
  gold: seeded(i + 100, 23, 3) === 0,
}));

/** Karta ichidagi bo'laklar ketma-ket, biroz kechikib chiqadi. */
const stack: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12, delayChildren: 0.35 } },
};

const rise: Variants = {
  hidden: { opacity: 0, y: 26, filter: "blur(6px)" },
  show: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.75, ease: [0.22, 1, 0.36, 1] },
  },
};

type Stage = "konvert" | "ochilmoqda" | "xat";

export function Invitation() {
  const reduced = useReducedMotion();
  const [stage, setStage] = useState<Stage>("konvert");

  const open = () => {
    if (stage !== "konvert") return;
    // Harakatni kamaytirish yoqilgan bo'lsa konvert animatsiyasi
    // o'tkazib yuboriladi — taklifnoma darhol ochiladi
    if (reduced) {
      setStage("xat");
      return;
    }
    setStage("ochilmoqda");
    // Zaxira: odatda xat animatsiyasi tugaganda `onOpened` chaqiriladi.
    // Agar u biror sababga ko'ra kelmasa (fon ilovaga o'tib ketgan,
    // animatsiya uzilgan), mehmon konvertda qolib ketmasligi kerak.
    setTimeout(() => setStage((s) => (s === "ochilmoqda" ? "xat" : s)), 2200);
  };

  return (
    <div className="relative isolate flex min-h-screen flex-col items-center justify-center overflow-hidden bg-ink-950 px-4 py-10 sm:py-16">
      <Backdrop reduced={!!reduced} celebrate={stage === "xat"} />

      <AnimatePresence mode="wait">
        {stage === "xat" ? (
          <Letter key="xat" reduced={!!reduced} />
        ) : (
          <Envelope
            key="konvert"
            opening={stage === "ochilmoqda"}
            onOpen={open}
            onOpened={() => setStage("xat")}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

/* ------------------------------------------------------------- konvert */

/**
 * Yopiq konvert.
 *
 * Qatlamlar tartibi muhim: orqa qism → xat → old cho'ntak → qopqoq → muhr.
 * Qopqoq ochilishi bilan uning `z-index`i tushadi, aks holda ko'tarilayotgan
 * xatning ustini yopib qolardi.
 */
function Envelope({
  opening,
  onOpen,
  onOpened,
}: {
  opening: boolean;
  onOpen: () => void;
  onOpened: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.85, y: 30 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 1.35, y: -60, transition: { duration: 0.5 } }}
      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      className="flex flex-col items-center gap-7"
    >
      <motion.button
        type="button"
        onClick={onOpen}
        disabled={opening}
        aria-label="Taklifnomani ochish"
        animate={opening ? undefined : { y: [0, -10, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        className="group relative w-[min(86vw,400px)] cursor-pointer rounded-2xl focus-visible:outline-none"
        style={{ perspective: 1400 }}
      >
        {/* Konvert ostidagi qizil yog'du */}
        <span
          className="absolute -inset-8 -z-10 rounded-full bg-brand-600/25 blur-3xl transition-opacity duration-500 group-hover:bg-brand-500/40"
          aria-hidden="true"
        />

        <div className="relative aspect-[3/2] w-full">
          {/* 1. Orqa qism */}
          <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-brand-800 to-brand-950 shadow-[0_30px_80px_rgba(0,0,0,0.6)]" />

          {/* 2. Ichidagi xat — qopqoq ochilgach ko'tariladi */}
          <motion.div
            initial={false}
            animate={
              opening
                ? { y: "-58%", opacity: 1, transition: { duration: 0.75, delay: 0.55, ease: [0.22, 1, 0.36, 1] } }
                : { y: "0%", opacity: 0 }
            }
            onAnimationComplete={() => {
              if (opening) onOpened();
            }}
            className="absolute inset-x-[7%] top-[14%] z-10 h-[74%] rounded-md bg-ink-50 shadow-[0_8px_24px_rgba(0,0,0,0.35)]"
          >
            {/* Xatdagi yozuv izlari — uzoqdan matnga o'xshaydi */}
            <div className="flex h-full flex-col justify-center gap-2 px-5">
              <span className="mx-auto h-1.5 w-1/3 rounded-full bg-brand-600/70" />
              <span className="h-1 w-full rounded-full bg-ink-300" />
              <span className="h-1 w-5/6 rounded-full bg-ink-300" />
              <span className="h-1 w-full rounded-full bg-ink-300" />
            </div>
          </motion.div>

          {/* 3. Old cho'ntak — xatning pastini yopib turadi */}
          <div
            className="absolute inset-0 z-20 rounded-xl bg-gradient-to-br from-brand-600 to-brand-800"
            style={{ clipPath: "polygon(0 36%, 50% 80%, 100% 36%, 100% 100%, 0 100%)" }}
            aria-hidden="true"
          />
          {/* Cho'ntak qirralari — konvertga hajm beradi */}
          <div
            className="absolute inset-0 z-20 rounded-xl bg-black/10"
            style={{ clipPath: "polygon(0 36%, 50% 80%, 0 100%)" }}
            aria-hidden="true"
          />
          <div
            className="absolute inset-0 z-20 rounded-xl bg-white/5"
            style={{ clipPath: "polygon(100% 36%, 50% 80%, 100% 100%)" }}
            aria-hidden="true"
          />

          {/* 4. Qopqoq — ochilganda orqaga ag'dariladi */}
          <motion.div
            initial={false}
            animate={{ rotateX: opening ? -172 : 0 }}
            transition={{ duration: 0.65, ease: [0.4, 0, 0.2, 1] }}
            style={{
              clipPath: "polygon(0 0, 100% 0, 50% 100%)",
              transformOrigin: "top center",
              transformStyle: "preserve-3d",
              // Ochilish boshlanishi bilan xatning ortiga o'tadi
              zIndex: opening ? 5 : 30,
            }}
            className="absolute inset-x-0 top-0 h-[64%] rounded-t-xl bg-gradient-to-b from-brand-500 to-brand-700"
            aria-hidden="true"
          />

          {/* 5. Muhr — qopqoq ochilgach yo'qoladi */}
          <motion.div
            initial={false}
            animate={
              opening
                ? { scale: 0, opacity: 0, transition: { duration: 0.3 } }
                : { scale: 1, opacity: 1 }
            }
            className="absolute top-[52%] left-1/2 z-40 -translate-x-1/2 -translate-y-1/2"
            aria-hidden="true"
          >
            {/* Muhr OQ: belgi qora va qizil ranglardan iborat, qizil mum
                ustiga qo'yilsa qora qismi umuman ko'rinmasdi */}
            <span className="relative grid size-16 place-items-center rounded-full bg-white shadow-[0_6px_20px_rgba(0,0,0,0.55)] ring-[5px] ring-brand-700 sm:size-20">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/taklifnoma/belgi.png"
                alt=""
                className="size-11 rounded-full object-contain sm:size-14"
              />
            </span>
          </motion.div>
        </div>
      </motion.button>

      {/* Taklif: nima qilish kerakligini aytib turadi */}
      <motion.p
        animate={opening ? { opacity: 0 } : { opacity: [0.55, 1, 0.55] }}
        transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
        className="flex items-center gap-2 text-[13px] font-semibold tracking-[0.25em] text-brand-300 uppercase"
      >
        <TouchIcon />
        Ochish uchun bosing
      </motion.p>
    </motion.div>
  );
}

/* ----------------------------------------------------------------- xat */

function Letter({ reduced }: { reduced: boolean }) {
  return (
    <motion.article
      initial={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.9, y: 50 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
      className="relative mx-auto w-full max-w-xl overflow-hidden rounded-[2rem] bg-white shadow-[0_30px_90px_rgba(0,0,0,0.55)]"
    >
      {/* Tepadagi qizil chiziq — "muhrlangan taklifnoma" hissi */}
      <div className="h-2 w-full bg-gradient-to-r from-brand-700 via-brand-500 to-brand-700" />

      {/* Kartaning ustidan bir marta o'tadigan yorug'lik */}
      {!reduced && (
        <motion.div
          initial={{ x: "-120%" }}
          animate={{ x: "120%" }}
          transition={{ duration: 1.6, delay: 0.5, ease: "easeInOut" }}
          className="pointer-events-none absolute inset-y-0 z-10 w-1/3 -skew-x-12 bg-gradient-to-r from-transparent via-white/70 to-transparent"
          aria-hidden="true"
        />
      )}

      <motion.div
        variants={stack}
        initial="hidden"
        animate="show"
        className="flex flex-col items-center gap-5 px-6 py-9 text-center sm:px-10 sm:py-12"
      >
        <Emblem reduced={reduced} />

        {/* "Hayriya auksioni" logotipning O'ZIDA bor — bu yerda
            takrorlanmaydi, shuning uchun yozuv "Taklifnoma" */}
        <motion.p
          variants={rise}
          className="text-[11px] font-semibold tracking-[0.35em] text-brand-600 uppercase sm:text-xs"
        >
          Taklifnoma
        </motion.p>

        <motion.div variants={rise}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/taklifnoma/logo.png"
            alt="Imkon Plus — hayriya auksioni"
            className="h-auto w-56 sm:w-72"
          />
        </motion.div>

        <motion.div variants={rise}>
          <Ornament />
        </motion.div>

        <motion.p
          variants={rise}
          className="font-invite text-[15px] tracking-[0.18em] text-ink-500 uppercase"
        >
          Hurmatli mehmon
        </motion.p>

        <motion.h1
          variants={rise}
          className="font-invite text-[27px] leading-[1.25] font-bold text-ink-900 italic sm:text-[34px]"
        >
          Sizni chin qalbdan
          <br />
          taklif etamiz
        </motion.h1>

        {/* To'yona uslubdagi matn — taklifnomaning yuragi */}
        <motion.div
          variants={rise}
          className="max-w-md space-y-3 font-invite text-[15px] leading-[1.9] text-ink-700 sm:text-[16.5px]"
        >
          <p>
            Hayotning eng go&apos;zal ko&apos;rinishi — mehrda. Shu mehrni bir
            joyga yig&apos;ish niyatida <strong>Imkon Plus</strong> hayriya
            auksionini o&apos;tkazmoqdamiz.
          </p>
          <p>
            Bu kunda imkoniyati cheklangan yurtdoshlarimiz qo&apos;li bilan
            yaratilgan ishlar o&apos;z egasini topadi. Har bir ilmoq, har bir
            chizgi ortida umid, mehnat va ishonch bor.
          </p>
          <p className="text-ink-900">
            Sizning ishtirokingiz — kimningdir ertangi kuniga qo&apos;yilgan
            qadam bo&apos;ladi.
          </p>
        </motion.div>

        <motion.div variants={rise} className="w-full">
          <DateBlock reduced={reduced} />
        </motion.div>

        <motion.div variants={rise} className="w-full">
          <AddressBlock />
        </motion.div>

        <motion.div variants={rise} className="w-full">
          <QrBlock />
        </motion.div>

        <motion.div variants={rise}>
          <Ornament />
        </motion.div>

        <motion.p
          variants={rise}
          className="font-invite text-[15px] leading-relaxed text-ink-600 italic"
        >
          Kelishingizdan mamnun bo&apos;lamiz.
          <br />
          <span className="font-semibold text-ink-900 not-italic">
            Hurmat bilan, «Imkon Plus» jamoasi
          </span>
        </motion.p>

        <motion.div variants={rise} className="w-full">
          <ShareRow />
        </motion.div>
      </motion.div>

      <div className="border-t border-ink-200 bg-ink-50 px-6 py-4 text-center">
        <a
          href="https://imkon-plus.uz"
          className="text-[13px] font-semibold text-ink-600 transition-colors hover:text-brand-600"
        >
          imkon-plus.uz
        </a>
      </div>
    </motion.article>
  );
}

/* ------------------------------------------------------------------ fon */

function Backdrop({ reduced, celebrate }: { reduced: boolean; celebrate: boolean }) {
  return (
    <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden" aria-hidden="true">
      {/* Uchta qizil yorug'lik dog'i — sekin suzadi */}
      {[
        { className: "left-[-10%] top-[-10%] size-[60vmax] bg-brand-700/25", x: 40, y: 30 },
        { className: "right-[-15%] top-[20%] size-[50vmax] bg-brand-500/20", x: -50, y: 40 },
        { className: "bottom-[-20%] left-[20%] size-[55vmax] bg-gold-700/15", x: 30, y: -40 },
      ].map((blob, index) => (
        <motion.div
          key={index}
          animate={reduced ? undefined : { x: [0, blob.x, 0], y: [0, blob.y, 0] }}
          transition={{ duration: 18 + index * 5, repeat: Infinity, ease: "easeInOut" }}
          className={`absolute rounded-full blur-[90px] ${blob.className}`}
        />
      ))}

      {/* Yuqoriga ko'tariladigan uchqunlar */}
      {!reduced &&
        SPARKS.map((spark, index) => (
          <motion.span
            key={index}
            initial={{ y: "105vh", opacity: 0 }}
            animate={{ y: "-10vh", opacity: [0, 1, 1, 0] }}
            transition={{
              duration: spark.duration,
              delay: spark.delay,
              repeat: Infinity,
              ease: "linear",
            }}
            style={{
              left: `${spark.left}%`,
              width: spark.size,
              height: spark.size,
            }}
            className="absolute rounded-full bg-brand-400 shadow-[0_0_8px_rgba(240,51,77,0.9)]"
          />
        ))}

      {/* Konfetti — konvert ochilgan PAYTDA tushadi, sahifa yuklanganda emas */}
      {!reduced &&
        celebrate &&
        CONFETTI.map((piece, index) => (
          <motion.span
            key={`c${index}`}
            initial={{ y: "-12vh", opacity: 1, rotate: piece.rotate }}
            animate={{ y: "110vh", opacity: [1, 1, 0], rotate: piece.rotate + 540 }}
            transition={{ duration: piece.duration, delay: piece.delay, ease: "easeIn" }}
            style={{ left: `${piece.left}%` }}
            className={`absolute h-3 w-1.5 rounded-[1px] ${
              piece.gold ? "bg-gold-500" : "bg-brand-500"
            }`}
          />
        ))}
    </div>
  );
}

/* --------------------------------------------------------------- bo'laklar */

function Emblem({ reduced }: { reduced: boolean }) {
  return (
    <motion.div variants={rise} className="relative">
      {/* Belgining ortidagi urib turgan halqa */}
      {!reduced && (
        <motion.span
          animate={{ scale: [1, 1.35, 1], opacity: [0.5, 0, 0.5] }}
          transition={{ duration: 2.6, repeat: Infinity, ease: "easeOut" }}
          className="absolute inset-0 rounded-full bg-brand-500/30"
          aria-hidden="true"
        />
      )}
      <motion.div
        animate={reduced ? undefined : { y: [0, -6, 0] }}
        transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
        className="relative size-24 overflow-hidden rounded-full border-4 border-brand-600/15 bg-white sm:size-28"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/taklifnoma/belgi.png"
          alt=""
          aria-hidden="true"
          className="size-full object-contain"
        />
      </motion.div>
    </motion.div>
  );
}

/** Matnlarni ajratib turadigan qizil bezak. */
function Ornament() {
  return (
    <div className="flex items-center gap-3" aria-hidden="true">
      <span className="h-px w-12 bg-gradient-to-r from-transparent to-brand-400 sm:w-16" />
      <span className="size-1.5 rotate-45 bg-brand-600" />
      <span className="h-px w-12 bg-gradient-to-l from-transparent to-brand-400 sm:w-16" />
    </div>
  );
}

function DateBlock({ reduced }: { reduced: boolean }) {
  return (
    <div className="rounded-2xl bg-gradient-to-br from-brand-700 to-brand-600 p-5 text-white shadow-[0_12px_40px_rgba(220,27,56,0.35)]">
      <div className="flex items-center justify-center gap-4 sm:gap-6">
        <motion.span
          initial={reduced ? undefined : { scale: 0.4, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 1, type: "spring", stiffness: 220, damping: 12 }}
          className="font-display text-6xl leading-none font-extrabold sm:text-7xl"
        >
          12
        </motion.span>

        <span className="h-14 w-px bg-white/30 sm:h-16" aria-hidden="true" />

        <div className="text-left">
          <p className="font-display text-xl leading-tight font-bold sm:text-2xl">Noyabr</p>
          <p className="text-sm text-white/80">2026-yil, chorshanba</p>
          <p className="mt-1 font-display text-2xl leading-none font-extrabold sm:text-3xl">
            11:00
          </p>
        </div>
      </div>

      {/* Tadbirgacha qolgan vaqt — jonli sanaydi */}
      <div className="mt-4 flex items-center justify-center gap-2 border-t border-white/20 pt-3 text-sm">
        <ClockIcon />
        <span className="text-white/80">Tadbirgacha:</span>
        <Countdown endAt={EVENT_AT} className="font-bold text-white" />
      </div>
    </div>
  );
}

function AddressBlock() {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-ink-200 bg-ink-50 p-4 text-left">
      <span className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-full bg-brand-600 text-white">
        <PinIcon />
      </span>
      <div>
        <p className="text-[11px] font-semibold tracking-[0.2em] text-ink-500 uppercase">
          Manzil
        </p>
        <p className="mt-1 text-[14px] leading-relaxed font-medium text-ink-800">{ADDRESS}</p>
      </div>
    </div>
  );
}

function QrBlock() {
  return (
    <div className="text-center">
      <p className="text-[11px] font-semibold tracking-[0.2em] text-brand-600 uppercase">
        Lokatsiya
      </p>
      <p className="mt-1 text-[13px] text-ink-500">
        Joyni xaritada ochish uchun QR kodni skanerlang
      </p>

      <motion.div
        whileHover={{ scale: 1.04 }}
        whileTap={{ scale: 0.98 }}
        transition={{ type: "spring", stiffness: 300, damping: 18 }}
        className="mx-auto mt-4 w-44 sm:w-52"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/taklifnoma/qr.png"
          alt="Tadbir manzilining QR kodi"
          className="size-full"
        />
      </motion.div>
    </div>
  );
}

/** Havolani ulashish — mehmonlar taklifnomani bir-biriga yuboradi. */
function ShareRow() {
  const [url, setUrl] = useState("");
  const [copied, setCopied] = useState(false);

  // `window` faqat brauzerda bor — manzil mount'dan keyin o'qiladi
  useEffect(() => setUrl(window.location.href), []);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard ruxsat bermasa (eski brauzer, HTTP) — jim o'tamiz
    }
  };

  const telegram = `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(
    "Imkon Plus hayriya auksioniga taklifnoma",
  )}`;

  return (
    <div className="flex flex-col gap-2 sm:flex-row">
      <button
        type="button"
        onClick={copy}
        className="flex h-11 flex-1 items-center justify-center gap-2 rounded-full border-2 border-ink-900 text-[14px] font-semibold text-ink-900 transition-colors duration-300 hover:bg-ink-900 hover:text-white"
      >
        <CopyIcon />
        {copied ? "Nusxa olindi" : "Havolani nusxalash"}
      </button>

      <a
        href={telegram}
        target="_blank"
        rel="noopener noreferrer"
        className="flex h-11 flex-1 items-center justify-center gap-2 rounded-full bg-brand-600 text-[14px] font-semibold text-white transition-[background-color,transform] duration-300 hover:bg-brand-700 active:scale-[0.97]"
      >
        <SendIcon />
        Telegramda ulashish
      </a>
    </div>
  );
}

/* ------------------------------------------------------------------ ikonkalar */

function TouchIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="size-4"
      aria-hidden="true"
    >
      <path d="M9 11V6a2 2 0 1 1 4 0v5" />
      <path d="M13 11V9.5a2 2 0 1 1 4 0V15a6 6 0 0 1-6 6h-1a6 6 0 0 1-5-2.7L3.6 16a2 2 0 0 1 3.2-2.4L9 15" />
    </svg>
  );
}

function PinIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="size-4"
      aria-hidden="true"
    >
      <path d="M12 21s-7-5.6-7-11a7 7 0 1 1 14 0c0 5.4-7 11-7 11Z" />
      <circle cx="12" cy="10" r="2.5" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      className="size-4"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  );
}

function CopyIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="size-4"
      aria-hidden="true"
    >
      <rect x="9" y="9" width="11" height="11" rx="2" />
      <path d="M5 15V5a2 2 0 0 1 2-2h8" />
    </svg>
  );
}

function SendIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="size-4"
      aria-hidden="true"
    >
      <path d="m21 3-9 18-2.5-7.5L2 11l19-8Z" />
    </svg>
  );
}
