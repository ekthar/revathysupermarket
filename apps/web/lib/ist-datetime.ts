/**
 * Delivery slot times are always entered and displayed in India Standard Time,
 * regardless of the browser's or server's local timezone. `<input type="datetime-local">`
 * values (and this app's admin forms) are bare "YYYY-MM-DDTHH:mm" strings with no
 * offset - if we let `new Date(...)` interpret those using the runtime's local
 * timezone, the same value means different instants on a UTC server vs. an
 * IST browser, silently shifting every slot by 5:30.
 *
 * Use `parseIst` wherever a bare datetime-local string comes in from a client,
 * and `formatIstDateTimeLocal` wherever one needs to go back out to a
 * datetime-local input.
 */

const IST_OFFSET = "+05:30";
const HAS_TIMEZONE = /(?:[zZ]|[+-]\d{2}:\d{2})$/;

/**
 * Parses a value into a Date, treating bare "YYYY-MM-DDTHH:mm[:ss]" strings
 * (no trailing Z/offset) as India Standard Time wall-clock time. Strings that
 * already carry a timezone designator, or non-string values, are parsed as-is.
 */
export function parseIst(value: unknown): Date {
  if (typeof value === "string" && !HAS_TIMEZONE.test(value)) {
    return new Date(`${value}${IST_OFFSET}`);
  }
  return new Date(value as string | number | Date);
}

/** Returns the IST calendar date (as a UTC-midnight Date) that `instant` falls on. */
export function serviceDateFor(instant: Date): Date {
  const localDate = instant.toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
  return new Date(`${localDate}T00:00:00.000Z`);
}

/** Formats an instant as a "YYYY-MM-DDTHH:mm" string in IST, for datetime-local inputs. */
export function formatIstDateTimeLocal(instant: Date): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(instant);
  const get = (type: string) => parts.find((part) => part.type === type)?.value ?? "00";
  return `${get("year")}-${get("month")}-${get("day")}T${get("hour")}:${get("minute")}`;
}
