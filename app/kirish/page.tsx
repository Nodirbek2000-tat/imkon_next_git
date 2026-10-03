"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Logo } from "@/components/ui/Logo";
import { useAuth } from "@/components/auth/AuthProvider";
import { GoogleButton } from "@/components/auth/GoogleButton";
import { api, ApiError } from "@/lib/api";
import { normalizeSchoolLogin, SCHOOL_LOGIN_RE } from "@/lib/utils";

/**
 * Oddiy foydalanuvchi Google yoki Telegram bot bilan kiradi.
 *
 * Telefon + parol yo'q — raqamni Telegram o'zi tasdiqlab beradi (botdagi
 * "kontakt yuborish" tugmasi), ya'ni SMS ham, parol ham ortiqcha bo'lib
 * qoladi. Eski SMS akkauntlari yo'qolmaydi: bot xuddi shu raqamni topib
 * mavjud akkauntga bog'lanadi.
 *
 * Maktablar esa klassik login + parol bilan kiradi — ularda telefon raqami
 * umuman yo'q, akkauntni administrator qo'lda ochib beradi. Shu sababli
 * maktab kirishi Google/Telegram sozlamalariga bog'liq emas: u har holda
 * ko'rinib turadi.
 */
type Step = "choose" | "telegram" | "maktab";

const BOT_USERNAME = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME;
const HAS_GOOGLE = Boolean(process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID);

function TelegramIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
      <path d="M9.78 18.65l.28-4.23 7.68-6.92c.34-.31-.07-.46-.52-.19L7.74 13.3 3.64 12c-.88-.25-.89-.86.2-1.3l15.97-6.16c.73-.33 1.43.18 1.15 1.3l-2.72 12.81c-.19.91-.74 1.13-1.5.71L12.6 16.3l-1.99 1.93c-.23.23-.42.42-.83.42z" />
    </svg>
  );
}

/** Maktab binosi — eshigi ochiq, ya'ni bitta yo'l bilan chizilgan shakl. */
function SchoolIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
      <path d="M12 2.2 1.4 8.1h21.2L12 2.2Z" />
      <path d="M4.2 9.6v11.6h4.6v-5.4h6.4v5.4h4.6V9.6H4.2Z" />
    </svg>
  );
}

/** `useSearchParams()` uchun Suspense — `/katalog` dagi bilan bir sabab. */
export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginContent />
    </Suspense>
  );
}

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, user } = useAuth();
  const reduced = useReducedMotion();

  // Foydalanuvchi qaysi sahifadan "Kirish"ni bosgan bo'lsa, kirgach o'sha
  // yerga qaytadi. `//` bilan boshlangan qiymat rad etiladi — tashqi saytga
  // ochiq-redirect bo'lib qolmasin.
  const next = searchParams.get("next");
  const redirectTo = next && next.startsWith("/") && !next.startsWith("//") ? next : "/profil";

  const [step, setStep] = useState<Step>("choose");
  const [code, setCode] = useState("");
  const [schoolLogin, setSchoolLogin] = useState("");
  const [schoolPassword, setSchoolPassword] = useState("");
  // Xato qaysi maydonga tegishli ekani ma'lum bo'lsa — aynan o'sha
  // maydon ostida chiqadi. Faqat "login yoki parol" noma'lum bo'lgan
  // holat umumiy qatorda qoladi
  const [loginError, setLoginError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  // Allaqachon kirgan bo'lsa — kelgan joyiga (yoki profilga) yuboramiz
  useEffect(() => {
    if (user) router.replace(redirectTo);
  }, [user, router, redirectTo]);

  const verifyTelegram = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");

    if (code.length !== 6) {
      setError("Kod 6 raqamdan iborat");
      return;
    }

    setBusy(true);
    try {
      const result = await api.telegramLogin(code);
      login(result.user);
      router.push(redirectTo);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Kod tasdiqlanmadi");
      setCode("");
    } finally {
      setBusy(false);
    }
  };

  const submitSchool = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setLoginError("");
    setPasswordError("");

    // Bo'sh maydon bilan so'rov yuborishning ma'nosi yo'q
    if (!schoolLogin) {
      setLoginError("Maktab loginini kiriting");
      return;
    }

    // Login shakli backend qoidasiga mos kelmasa — so'rovni YUBORMAYMIZ.
    // Backend bunday holatda ham "Login yoki parol noto'g'ri" deb javob
    // beradi, o'qituvchi esa aybni parolda deb o'ylab, uni qayta-qayta
    // yozib ovora bo'ladi. Shuning uchun xatoni o'zimiz aniq aytamiz
    if (schoolLogin.length < 3) {
      setLoginError("Login juda qisqa — kamida 3 belgi bo'lishi kerak.");
      return;
    }
    if (!SCHOOL_LOGIN_RE.test(schoolLogin)) {
      setLoginError("Login harf yoki raqam bilan boshlanadi, chiziqcha bilan emas.");
      return;
    }

    if (!schoolPassword) {
      setPasswordError("Parolni kiriting");
      return;
    }

    setBusy(true);
    try {
      const result = await api.schoolLogin(schoolLogin, schoolPassword);
      login(result.user);
      router.push(redirectTo);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Login yoki parol xato");
      setSchoolPassword("");
    } finally {
      setBusy(false);
    }
  };

  const fade = {
    initial: reduced ? { opacity: 0 } : { opacity: 0, x: 24 },
    animate: { opacity: 1, x: 0 },
    transition: { duration: reduced ? 0.2 : 0.4, ease: [0.22, 1, 0.36, 1] as const },
  };

  return (
    <section className="relative flex min-h-[calc(100vh-5rem)] items-center overflow-hidden py-16">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 left-1/2 size-[720px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-radial from-brand-500/12 to-transparent blur-3xl"
      />

      <Container className="relative">
        <div className="mx-auto max-w-md">
          <div className="mb-10 text-center">
            <Logo priority className="mx-auto h-12" />
            <h1 className="mt-6 text-[clamp(1.9rem,5vw,2.5rem)] leading-tight font-extrabold">
              Xush kelibsiz
            </h1>
            <p className="mt-3 text-ink-600 dark:text-ink-400">
              {step === "choose"
                ? "Davom etish uchun akkauntingizni tanlang."
                : step === "telegram"
                  ? "Botdagi kodni shu yerga kiriting."
                  : "Maktab login va parolingizni kiriting."}
            </p>
          </div>

          <div className="rounded-[var(--radius-card)] border bg-[var(--surface)] p-7 shadow-[var(--shadow-soft)]">
            {step === "choose" ? (
              <motion.div key="choose" {...fade} className="space-y-4">
                <GoogleButton onError={setError} redirectTo={redirectTo} divider={false} />

                {BOT_USERNAME && (
                  <button
                    type="button"
                    onClick={() => {
                      setStep("telegram");
                      setError("");
                    }}
                    // Google o'z tugmasini o'zi chizadi — balandligi va
                    // shakli shunga moslangan, ikkalasi juft bo'lib ko'rinsin
                    className="flex h-11 w-full items-center justify-center gap-3 rounded-full border border-[var(--line)] px-5 text-sm font-medium transition-colors duration-300 hover:border-[#229ED9] hover:text-[#229ED9]"
                  >
                    <TelegramIcon className="size-5 text-[#229ED9]" />
                    Telegram bot bilan davom etish
                  </button>
                )}

                {/* Google ham, bot ham sozlanmagan bo'lsa tepa qism bo'm-bo'sh
                    qolardi. Maktab kirishi esa ishlayveradi — shuning uchun
                    xabar "hammasi o'chiq" demaydi, faqat o'sha ikkisini aytadi */}
                {!BOT_USERNAME && !HAS_GOOGLE && (
                  <p className="py-2 text-center text-sm text-ink-600 dark:text-ink-400">
                    Xaridorlar uchun kirish hozircha sozlanmagan. Administrator
                    bilan bog&apos;laning.
                  </p>
                )}

                {/* Maktab — butunlay boshqa yo'l, shuning uchun ko'rinadigan
                    chiziq bilan ajratiladi. Tepada hech narsa bo'lmasa
                    chiziqning ham hojati yo'q */}
                {(BOT_USERNAME || HAS_GOOGLE) && (
                  <div className="flex items-center gap-3 pt-1">
                    <span className="h-px flex-1 bg-[var(--line)]" />
                    <span className="text-[13px] text-ink-600 dark:text-ink-400">yoki</span>
                    <span className="h-px flex-1 bg-[var(--line)]" />
                  </div>
                )}

                <div>
                  <button
                    type="button"
                    onClick={() => {
                      setStep("maktab");
                      setError("");
                    }}
                    className="flex h-11 w-full items-center justify-center gap-3 rounded-full border border-[var(--line)] px-5 text-sm font-medium transition-colors duration-300 hover:border-brand-600 hover:text-brand-600"
                  >
                    <SchoolIcon className="size-5 text-brand-600" />
                    Maktab sifatida kirish
                  </button>
                  <p className="mt-2.5 text-center text-[13px] leading-relaxed text-ink-600 dark:text-ink-400">
                    Maktablar uchun login va parolni administrator beradi.
                  </p>
                </div>

                {error && (
                  <p role="alert" className="pt-1 text-center text-sm font-medium text-brand-600">
                    {error}
                  </p>
                )}
              </motion.div>
            ) : step === "telegram" ? (
              <motion.form key="telegram" {...fade} onSubmit={verifyTelegram} className="space-y-5">
                <button
                  type="button"
                  onClick={() => {
                    setStep("choose");
                    setCode("");
                    setError("");
                  }}
                  className="text-sm font-medium text-ink-600 hover:text-brand-600 dark:text-ink-400"
                >
                  ← Orqaga
                </button>

                <a
                  href={`https://t.me/${BOT_USERNAME}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-3 rounded-2xl border-2 border-dashed border-[var(--line)] p-4 transition-colors hover:border-[#229ED9]"
                >
                  <TelegramIcon className="size-6 shrink-0 text-[#229ED9]" />
                  <span className="text-sm">
                    <span className="block font-semibold">@{BOT_USERNAME} botini oching</span>
                    <span className="block text-ink-600 dark:text-ink-400">
                      &ldquo;🔐 Saytga kirish&rdquo; tugmasini bosing
                    </span>
                  </span>
                </a>

                <Input
                  id="telegram-code"
                  label="Bot yuborgan kod"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  placeholder="000000"
                  className="text-center font-mono text-2xl tracking-[0.5em]"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                  error={error}
                  disabled={busy}
                />

                <Button size="lg" className="w-full" disabled={busy || code.length !== 6}>
                  {busy ? "Tekshirilmoqda…" : "Tasdiqlash"}
                </Button>
              </motion.form>
            ) : (
              <motion.form key="maktab" {...fade} onSubmit={submitSchool} className="space-y-5">
                <button
                  type="button"
                  onClick={() => {
                    setStep("choose");
                    setSchoolPassword("");
                    setError("");
                    setLoginError("");
                    setPasswordError("");
                  }}
                  className="text-sm font-medium text-ink-600 hover:text-brand-600 dark:text-ink-400"
                >
                  ← Orqaga
                </button>

                <Input
                  id="school-login"
                  label="Maktab logini"
                  hint="Masalan: 15-maktab-chirchiq. Faqat kichik lotin harflari, raqamlar va chiziqcha."
                  autoComplete="username"
                  autoCapitalize="none"
                  spellCheck={false}
                  placeholder="15-maktab-chirchiq"
                  value={schoolLogin}
                  // Tozalash qoidasi admin panelidagi bilan BIR XIL bo'lishi
                  // shart: ikkovi ham `normalizeSchoolLogin` ni ishlatadi.
                  // Aks holda bo'sh joyli login bir joyda "chilonzor-12",
                  // boshqasida "chilonzor12" bo'lib chiqadi va qog'ozdagi
                  // loginni ko'chirgan o'qituvchi tizimga kira olmaydi
                  onChange={(e) => {
                    setSchoolLogin(normalizeSchoolLogin(e.target.value));
                    setLoginError("");
                    setError("");
                  }}
                  error={loginError}
                  disabled={busy}
                />

                <Input
                  id="school-password"
                  label="Parol"
                  type="password"
                  autoComplete="current-password"
                  placeholder="••••••"
                  value={schoolPassword}
                  onChange={(e) => {
                    setSchoolPassword(e.target.value);
                    setPasswordError("");
                    setError("");
                  }}
                  error={passwordError}
                  disabled={busy}
                />

                {/* Faqat serverdan kelgan xato shu yerda chiqadi: u login
                    bilan parolning qaysi biri xato ekanini aytmaydi. Biz
                    o'zimiz topgan xatolar maydonlar ostida ko'rinadi */}
                {error && (
                  <p role="alert" className="text-sm font-medium text-brand-600">
                    {error}
                  </p>
                )}

                <Button size="lg" className="w-full" disabled={busy}>
                  {busy ? "Kirilmoqda…" : "Kirish"}
                </Button>

                <p className="text-center text-[13px] leading-relaxed text-ink-600 dark:text-ink-400">
                  Login va parolni esdan chiqarsangiz administrator yangisini
                  beradi.
                </p>
              </motion.form>
            )}
          </div>

          <p className="mt-6 text-center text-[13px] leading-relaxed text-ink-600 dark:text-ink-400">
            Davom etish orqali{" "}
            <a href="/shartlar" className="font-medium text-brand-600 hover:underline">
              foydalanish shartlari
            </a>
            ga rozilik bildirasiz.
          </p>
        </div>
      </Container>
    </section>
  );
}
