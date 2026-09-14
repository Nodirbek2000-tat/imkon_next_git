"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/components/auth/AuthProvider";

const CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? "";
const SCRIPT_SRC = "https://accounts.google.com/gsi/client";

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential: string }) => void;
          }) => void;
          renderButton: (parent: HTMLElement, options: Record<string, unknown>) => void;
        };
      };
    };
  }
}

type Props = {
  onError?: (message: string) => void;
  /** "login" — /kirish sahifasida kirish. "link" — profilga Google'ni bog'lash. */
  mode?: "login" | "link";
  /** `mode="link"` bo'lganda bog'langach chaqiriladi (masalan `refreshUser`). */
  onLinked?: () => void;
  /** `mode="login"` bo'lganda kirgach qayerga yuborish (masalan foydalanuvchi
      qaysi sahifadan "Kirish"ni bosgan bo'lsa). Telefon so'ralsa bunga qaramay
      har doim `/profil?telefon=1`ga boradi — bu tizim talabi. */
  redirectTo?: string;
  /** Tepadagi "yoki" ajratgichi. Tugma birinchi turgan joyda kerak emas. */
  divider?: boolean;
};

/**
 * "Google bilan davom etish" / "Google'ni bog'lash".
 *
 * NEXT_PUBLIC_GOOGLE_CLIENT_ID sozlanmagan bo'lsa umuman chizilmaydi —
 * ishlamaydigan tugma ko'rsatishdan ko'ra yo'q bo'lgani yaxshi.
 */
export function GoogleButton({
  onError,
  mode = "login",
  onLinked,
  redirectTo = "/profil",
  divider = true,
}: Props) {
  const router = useRouter();
  const { login } = useAuth();
  const boxRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!CLIENT_ID) return;

    const handleCredential = async (response: { credential: string }) => {
      try {
        if (mode === "link") {
          await api.linkGoogle(response.credential);
          onLinked?.();
          return;
        }
        const result = await api.googleLogin(response.credential);
        login(result.user);
        router.push(result.needs_phone ? "/profil?telefon=1" : redirectTo);
      } catch (err) {
        onError?.(
          err instanceof ApiError
            ? err.message
            : mode === "link"
              ? "Google bog'lanmadi"
              : "Google orqali kirilmadi",
        );
      }
    };

    const setup = () => {
      if (!window.google || !boxRef.current) return;

      window.google.accounts.id.initialize({
        client_id: CLIENT_ID,
        callback: handleCredential,
      });
      window.google.accounts.id.renderButton(boxRef.current, {
        theme: "outline",
        size: "large",
        width: 360,
        text: "continue_with",
        shape: "pill",
        locale: "uz",
      });
      setReady(true);
    };

    if (window.google) {
      setup();
      return;
    }

    const existing = document.querySelector<HTMLScriptElement>(`script[src="${SCRIPT_SRC}"]`);
    if (existing) {
      existing.addEventListener("load", setup);
      return () => existing.removeEventListener("load", setup);
    }

    const script = document.createElement("script");
    script.src = SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.onload = setup;
    document.head.appendChild(script);
  }, [login, router, onError, mode, onLinked, redirectTo]);

  if (!CLIENT_ID) return null;

  return (
    <div>
      {mode === "login" && divider && (
        <div className="mt-6 mb-5 flex items-center gap-3">
          <span className="h-px flex-1 bg-[var(--line)]" />
          <span className="text-[13px] text-ink-600 dark:text-ink-400">yoki</span>
          <span className="h-px flex-1 bg-[var(--line)]" />
        </div>
      )}

      <div ref={boxRef} className="flex justify-center" />

      {!ready && (
        <div className="h-11 animate-shimmer rounded-full bg-ink-200 dark:bg-ink-800" />
      )}
    </div>
  );
}
