"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { locales, type Locale } from "@/i18n/config";

const languageLabels: Record<Locale, string> = {
  en: "English",
  ml: "മലയാളം"
};

export function LanguageSwitcher() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

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

    startTransition(() => {
      router.refresh();
    });
  }

  // Get current locale from cookie
  function getCurrentLocale(): Locale {
    if (typeof document === "undefined") return "en";
    const match = document.cookie.match(/(?:^|; )locale=([^;]*)/);
    return (match?.[1] as Locale) || "en";
  }

  return (
    <select
      onChange={handleChange}
      defaultValue={getCurrentLocale()}
      disabled={isPending}
      className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50"
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
