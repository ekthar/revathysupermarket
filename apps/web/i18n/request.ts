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

  try {
    const messages = (await import(`./messages/${locale}.json`)).default;
    return { locale, messages };
  } catch (error) {
    console.error(`[i18n] Failed to load messages for locale "${locale}":`, error);
    // Fall back to default locale if the requested locale file fails to load
    if (locale !== defaultLocale) {
      const fallbackMessages = (await import(`./messages/${defaultLocale}.json`)).default;
      return { locale: defaultLocale, messages: fallbackMessages };
    }
    return { locale, messages: {} };
  }
});
