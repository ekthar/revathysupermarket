import type { StoreSettings } from "@/lib/store-settings";

export function calculateInclusiveGst(total: number, gstRatePercent = 0) {
  const safeTotal = Number.isFinite(total) ? total : 0;
  const rate = Number.isFinite(gstRatePercent) ? Math.max(0, gstRatePercent) : 0;

  if (rate <= 0) {
    return {
      rate,
      taxableValue: safeTotal,
      gstAmount: 0,
      cgst: 0,
      sgst: 0
    };
  }

  const taxableValue = safeTotal / (1 + rate / 100);
  const gstAmount = safeTotal - taxableValue;

  return {
    rate,
    taxableValue,
    gstAmount,
    cgst: gstAmount / 2,
    sgst: gstAmount / 2
  };
}

export function gstBusinessName(settings: StoreSettings) {
  return settings.gstBusinessName?.trim() || settings.storeName;
}
