"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { locales, type Locale } from "@/i18n/config";

const languageLabels: Record<Locale, string> = {
  en: "English",
  ml: "മലയാളം"
};

/** Reads the locale cookie. Must only be called client-side, in an effect. */
function getCurrentLocale(): Locale {
  if (typeof document === "undefined") return "en";
  const match = document.cookie.match(/(?:^|; )locale=([^;]*)/);
  return (match?.[1] as Locale) || "en";
}

export function LanguageSwitcher() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  // Reading document.cookie must happen in an effect, not during render.
  // On the server this component renders with no `document`, so a
  // render-time read (`getCurrentLocale()` called directly in JSX) computes
  // "en" during SSR and can compute a DIFFERENT locale the instant the client
  // hydrates — a classic hydration-mismatch anti-pattern. Defer the real
  // value to an effect so both the server and the first client render agree.
  const [locale, setLocale] = useState<Locale>("en");
  useEffect(() => {
    setLocale(getCurrentLocale());
  }, []);

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const newLocale = e.target.value as Locale;

    // Save to cookie
    document.cookie = `locale=${newLocale};path=/;max-age=${60 * 60 * 24 * 365}`;

    // Update user preference via API if logged in
    fetch("/api/user/language", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ language: newLocale })
    }).catch(() => {
      // Silently fail if not logged in or API unavailable
    });

    setLocale(newLocale);
    startTransition(() => {
      router.refresh();
    });
  }

  return (
    <select
      onChange={handleChange}
      value={locale}
      disabled={isPending}
      className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200 dark:hover:bg-neutral-800 dark:focus:ring-offset-neutral-950"
      aria-label="Select language"
    >
      {locales.map((locale) => (
        <option key={locale} value={locale}>
          {languageLabels[locale]}
        </option>
      ))}
    </select>
  );
}
