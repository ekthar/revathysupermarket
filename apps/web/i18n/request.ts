import { getRequestConfig } from "next-intl/server";
import { cookies, headers } from "next/headers";
import { defaultLocale, locales, type Locale } from "./config";

export default getRequestConfig(async () => {
  // Check cookie first
  const cookieStore = await cookies();
  const localeCookie = cookieStore.get("locale")?.value;

  let locale: Locale = defaultLocale;

  if (localeCookie && locales.includes(localeCookie as Locale)) {
    locale = localeCookie as Locale;
  } else {
    // Fall back to Accept-Language header
    const headerStore = await headers();
    const acceptLanguage = headerStore.get("accept-language") || "";
    const preferredLanguages = acceptLanguage
      .split(",")
      .map((lang) => lang.split(";")[0].trim().substring(0, 2));

    for (const lang of preferredLanguages) {
      if (locales.includes(lang as Locale)) {
        locale = lang as Locale;
        break;
      }
    }
  }

  return {
    locale,
    messages: (await import(`./messages/${locale}.json`)).default
  };
});
