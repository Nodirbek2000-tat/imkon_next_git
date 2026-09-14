"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { GoogleButton } from "@/components/auth/GoogleButton";
import { useAuth } from "@/components/auth/AuthProvider";
import { api, ApiError } from "@/lib/api";

const BOT_USERNAME = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME;

/**
 * Profildagi "Bog'langan akkauntlar" bo'limi.
 *
 * Avtomatik hisob birlashtirish yo'q — faqat tizimga kirgan foydalanuvchi
 * o'zi ongli ravishda bosadi. Bu boshqa birovning Google/Telegram
 * akkauntini o'ziniki qilib olishning oldini oladi.
 */
export function LinkedAccounts() {
  const { user, refreshUser } = useAuth();
  const [showTelegramForm, setShowTelegramForm] = useState(false);
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordBusy, setPasswordBusy] = useState(false);

  if (!user) return null;

  const linkTelegram = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");

    if (code.length !== 6) {
      setError("Kod 6 raqamdan iborat");
      return;
    }

    setBusy(true);
    try {
      await api.linkTelegram(code);
      await refreshUser();
      setCode("");
      setShowTelegramForm(false);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Bog'lanmadi");
    } finally {
      setBusy(false);
    }
  };

  const savePassword = async (event: React.FormEvent) => {
    event.preventDefault();
    setPasswordError("");

    if (password.length < 6) {
      setPasswordError("Parol kamida 6 belgidan iborat bo'lsin");
      return;
    }
    if (password !== passwordConfirm) {
      setPasswordError("Parollar mos kelmadi");
      return;
    }

    setPasswordBusy(true);
    try {
      await api.setPassword(password);
      await refreshUser();
      setPassword("");
      setPasswordConfirm("");
      setShowPasswordForm(false);
    } catch (err) {
      setPasswordError(err instanceof ApiError ? err.message : "Saqlanmadi");
    } finally {
      setPasswordBusy(false);
    }
  };

  return (
    <div className="rounded-[var(--radius-card)] border bg-[var(--surface)] p-6">
      <h2 className="text-lg font-bold">Bog&apos;langan akkauntlar</h2>
      <p className="mt-1 text-sm text-ink-600 dark:text-ink-400">
        Google yoki Telegram orqali ham kira olishingiz uchun bog&apos;lang.
      </p>

      <div className="mt-5 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[var(--line)] p-4">
          <span className="text-sm font-medium">Google</span>
          {user.has_google ? (
            <span className="text-sm font-semibold text-emerald-600">Bog&apos;langan</span>
          ) : (
            <GoogleButton mode="link" onError={setError} onLinked={refreshUser} />
          )}
        </div>

        <div className="rounded-2xl border border-[var(--line)] p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="text-sm font-medium">
              Telegram
              {user.has_telegram && user.telegram_username ? ` — @${user.telegram_username}` : ""}
            </span>
            {user.has_telegram ? (
              <span className="text-sm font-semibold text-emerald-600">Bog&apos;langan</span>
            ) : (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowTelegramForm((s) => !s)}
              >
                Bog&apos;lash
              </Button>
            )}
          </div>

          {!user.has_telegram && showTelegramForm && (
            <form onSubmit={linkTelegram} className="mt-4 space-y-3">
              {BOT_USERNAME && (
                <a
                  href={`https://t.me/${BOT_USERNAME}`}
                  target="_blank"
                  rel="noreferrer"
                  className="block text-sm font-medium text-brand-600 hover:underline"
                >
                  1. Botga o&apos;ting, telefon raqamingizni yuboring →
                </a>
              )}
              <Input
                id="telegram-link-code"
                label="2. Bot yuborgan kod"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                placeholder="000000"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                error={error}
                disabled={busy}
              />
              <Button size="sm" disabled={busy || code.length !== 6}>
                {busy ? "Tekshirilmoqda…" : "Tasdiqlash"}
              </Button>
            </form>
          )}
        </div>

        <div className="rounded-2xl border border-[var(--line)] p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="text-sm font-medium">Parol (login bilan kirish uchun)</span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowPasswordForm((s) => !s)}
            >
              {user.has_password ? "Yangilash" : "O'rnatish"}
            </Button>
          </div>

          {showPasswordForm && (
            <form onSubmit={savePassword} className="mt-4 space-y-3">
              <Input
                id="new-password"
                label="Yangi parol"
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={passwordBusy}
              />
              <Input
                id="new-password-confirm"
                label="Parolni tasdiqlang"
                type="password"
                autoComplete="new-password"
                value={passwordConfirm}
                onChange={(e) => setPasswordConfirm(e.target.value)}
                error={passwordError}
                disabled={passwordBusy}
              />
              <Button size="sm" disabled={passwordBusy}>
                {passwordBusy ? "Saqlanmoqda…" : "Saqlash"}
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
