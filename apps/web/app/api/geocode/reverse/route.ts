import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const schema = z.object({
  latitude: z.coerce.number().min(-90).max(90),
  longitude: z.coerce.number().min(-180).max(180)
});

type NominatimAddress = {
  house_number?: string;
  road?: string;
  neighbourhood?: string;
  suburb?: string;
  village?: string;
  town?: string;
  city?: string;
  county?: string;
  state_district?: string;
  state?: string;
  postcode?: string;
  country?: string;
  country_code?: string;
};

type NominatimResponse = {
  display_name?: string;
  address?: NominatimAddress;
};

/**
 * Reverse geocoding API using OpenStreetMap Nominatim (free, no API key needed).
 * Returns structured address from GPS coordinates.
 *
 * GET /api/geocode/reverse?latitude=8.64&longitude=76.84
 */
export async function GET(request: NextRequest) {
  const lat = request.nextUrl.searchParams.get("latitude");
  const lng = request.nextUrl.searchParams.get("longitude");

  const parsed = schema.safeParse({ latitude: lat, longitude: lng });
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid coordinates" }, { status: 400 });
  }

  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${parsed.data.latitude}&lon=${parsed.data.longitude}&addressdetails=1&zoom=18`,
      {
        headers: {
          "User-Agent": "RevathySupermarket/1.0 (grocery-delivery-app)",
          Accept: "application/json"
        },
        next: { revalidate: 86400 } // Cache for 24 hours
      }
    );

    if (!response.ok) {
      return NextResponse.json({ error: "Geocoding service unavailable" }, { status: 502 });
    }

    const data: NominatimResponse = await response.json();
    const addr = data.address;

    if (!addr) {
      return NextResponse.json({ error: "Address not found for coordinates" }, { status: 404 });
    }

    // Build structured address from Nominatim response
    const street = [addr.road, addr.neighbourhood, addr.suburb]
      .filter(Boolean)
      .join(", ") || addr.village || addr.town || "";

    const landmark = [addr.village, addr.town, addr.suburb, addr.neighbourhood]
      .filter(Boolean)
      .filter((v) => !street.includes(v!))
      .slice(0, 2)
      .join(", ") || "";

    const locality = addr.city || addr.town || addr.village || addr.county || addr.state_district || "";
    const state = addr.state || "";
    const pincode = addr.postcode || "";

    // House number if available
    const houseName = addr.house_number || "";

    return NextResponse.json({
      houseName,
      street,
      landmark,
      pincode,
      locality,
      state,
      displayAddress: data.display_name || "",
      raw: addr
    });
  } catch (error) {
    console.error("Reverse geocoding failed:", error);
    return NextResponse.json({ error: "Geocoding failed. Please enter address manually." }, { status: 500 });
  }
}
