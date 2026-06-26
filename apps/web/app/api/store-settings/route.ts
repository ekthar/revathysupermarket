import { NextResponse } from "next/server";
import { getPublicStoreSettings } from "@/lib/store-settings";

// GET /api/store-settings - Public endpoint for client-side components (cart, checkout)
// Returns only the fields needed for billing calculations
export async function GET() {
  try {
    const settings = await getPublicStoreSettings();
    return NextResponse.json({
      gstRatePercent: settings.gstRatePercent,
      deliveryFee: settings.deliveryFee,
      freeDeliveryThreshold: settings.freeDeliveryThreshold,
      minimumOrderValue: settings.minimumOrderValue,
      storeName: settings.storeName,
      gstin: settings.gstin
    });
  } catch {
    return NextResponse.json({
      gstRatePercent: 0,
      deliveryFee: 40,
      freeDeliveryThreshold: 500,
      minimumOrderValue: 99,
      storeName: "",
      gstin: ""
    });
  }
}
