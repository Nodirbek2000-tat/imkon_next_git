"use client";

import { useEffect, useState } from "react";

type Theme = "dark" | "light";

function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme;
  localStorage.setItem("imkon-theme", theme);
}

export function ThemeToggle() {
  // null — hali mount bo'lmagan (SSR'da localStorage yo'q)
  const [theme, setTheme] = useState<Theme | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem("imkon-theme");
    const initial: Theme = saved === "light" ? "light" : "dark";
    setTheme(initial);
    // Atributni ham qayta qo'llaymiz: React hidratsiyasi server'dagi
    // data-theme="dark" ni tiklab qo'yishi mumkin — head'dagi skript
    // yolg'iz yetarli emas.
    applyTheme(initial);
  }, []);

  const toggle = () => {
    const next: Theme = theme === "dark" ? "light" : "dark";
    setTheme(next);
    applyTheme(next);
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={theme === "light" ? "Kechki rejimga o'tish" : "Kunduzgi rejimga o'tish"}
      className="grid size-10 place-items-center rounded-full text-ink-600 transition-colors duration-300 hover:bg-ink-900/[0.06] hover:text-brand-600 dark:text-ink-400 dark:hover:bg-ink-100/10"
    >
      {/* Ikonka almashishi bilan yumshoq aylanadi */}
      <span
        className="grid place-items-center transition-transform duration-500 [transition-timing-function:var(--ease-spring)]"
        style={{ transform: theme === "light" ? "rotate(0deg)" : "rotate(180deg)" }}
      >
        {theme === "light" ? <SunIcon /> : <MoonIcon />}
      </span>
    </button>
  );
}

function SunIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="4.5" stroke="currentColor" strokeWidth="2" />
      <path
        d="M12 2.5v3M12 18.5v3M21.5 12h-3M5.5 12h-3M18.7 5.3l-2.1 2.1M7.4 16.6l-2.1 2.1M18.7 18.7l-2.1-2.1M7.4 7.4 5.3 5.3"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M20.5 14.5A8.5 8.5 0 0 1 9.5 3.5a8.5 8.5 0 1 0 11 11Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
}
