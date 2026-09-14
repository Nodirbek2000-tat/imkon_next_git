"use client";

import { useEffect, useRef, useState } from "react";
import { LANGUAGES, getLang, setLang, type Lang } from "@/lib/api";

import { cn } from "@/lib/utils";

export function LangSwitcher() {
  const [lang, setLangState] = useState<Lang>("uz");
  const [open, setOpen] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  // api.ts tilni localStorage'dan o'zi o'qigan — bu yerda faqat ko'rsatamiz
  useEffect(() => {
    setLangState(getLang());
  }, []);

  // Tashqariga bosilsa yopamiz
  useEffect(() => {
    if (!open) return;
    const onClick = (event: MouseEvent) => {
      if (!boxRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && setOpen(false);

    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const choose = (next: Lang) => {
    setLangState(next);
    setLang(next); // localStorage'ga ham yozadi
    setOpen(false);
    // Sahifadagi ma'lumot API'dan keladi — eng ishonchli yo'li qayta yuklash
    location.reload();
  };

  const active = LANGUAGES.find((l) => l.code === lang) ?? LANGUAGES[0];

  return (
    <div ref={boxRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label={`Til: ${active.label}. O'zgartirish`}
        className="grid h-10 min-w-11 place-items-center rounded-full px-2 text-[13px] font-bold text-ink-600 transition-colors duration-300 hover:bg-ink-900/[0.06] hover:text-brand-600 dark:text-ink-400 dark:hover:bg-ink-100/10"
      >
        {active.short}
      </button>

      {open && (
        <ul
          role="listbox"
          aria-label="Tilni tanlang"
          className="absolute right-0 z-50 mt-2 w-40 overflow-hidden rounded-2xl border bg-[var(--surface)] py-1.5 shadow-[var(--shadow-lift)]"
        >
          {LANGUAGES.map((item) => (
            <li key={item.code}>
              <button
                type="button"
                role="option"
                aria-selected={item.code === lang}
                onClick={() => choose(item.code)}
                className={cn(
                  "flex w-full items-center justify-between px-4 py-2.5 text-left text-sm transition-colors duration-200",
                  item.code === lang
                    ? "font-bold text-brand-600"
                    : "hover:bg-ink-900/[0.05] dark:hover:bg-ink-100/10",
                )}
              >
                {item.label}
                {item.code === lang && (
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                    <path
                      d="m3 8.5 3.5 3.5L13 5"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
