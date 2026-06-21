export function safeCallbackUrl(value: string | null | undefined, fallback: string, allowedPrefixes: string[] = []) {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.includes("\\")) return fallback;
  try {
    const url = new URL(value, "https://local.invalid");
    if (url.origin !== "https://local.invalid") return fallback;
    if (allowedPrefixes.length > 0 && !allowedPrefixes.some((prefix) => url.pathname === prefix || (prefix !== "/" && url.pathname.startsWith(`${prefix}/`)))) return fallback;
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return fallback;
  }
}
