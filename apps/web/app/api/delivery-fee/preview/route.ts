import { NextResponse } from "next/server";
import { z } from "zod";
import { calculateDistanceKm } from "@/lib/distance";
import { calculateDeliveryFee } from "@/lib/delivery-fee";
import { getStoreSettingsForApi } from "@/lib/store-settings";
import { enforceRateLimit, rateLimitResponse } from "@/lib/distributed-rate-limit";
import { clientIp } from "@/lib/request-security";

const schema = z.object({ latitude: z.coerce.number().min(-90).max(90), longitude: z.coerce.number().min(-180).max(180), subtotal: z.coerce.number().min(0).max(1_000_000) });

export async function POST(request: Request) {
  const limit = await enforceRateLimit(`fee-preview:${clientIp(request)}`, 60, 60);
  if (limit.limited) return rateLimitResponse(limit.reset);
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Valid coordinates and subtotal are required.", code: "INVALID_FEE_PREVIEW" }, { status: 400 });
  const settings = await getStoreSettingsForApi();
  const distanceKm = calculateDistanceKm({ lat: parsed.data.latitude, lng: parsed.data.longitude }, { lat: settings.storeLatitude, lng: settings.storeLongitude });
  if (distanceKm > settings.deliveryRadiusKm) return NextResponse.json({ error: "Address is outside the delivery area.", code: "OUTSIDE_DELIVERY_AREA", distanceKm }, { status: 400 });
  const quote = await calculateDeliveryFee(distanceKm, parsed.data.subtotal);
  return NextResponse.json(quote);
}
