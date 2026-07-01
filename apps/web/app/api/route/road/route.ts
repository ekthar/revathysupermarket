import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const schema = z.object({
  fromLat: z.coerce.number().min(-90).max(90),
  fromLng: z.coerce.number().min(-180).max(180),
  toLat: z.coerce.number().min(-90).max(90),
  toLng: z.coerce.number().min(-180).max(180)
});

/**
 * Road-snapped route between two points, via the public OSRM demo server.
 *
 * Used by the live delivery-tracking map so the rider's route line follows
 * actual roads instead of drawing a straight line through buildings.
 *
 * GET /api/route/road?fromLat=..&fromLng=..&toLat=..&toLng=..
 * Returns: { coordinates: [lng, lat][], distanceMetres, durationSeconds } | { error }
 */
export async function GET(request: NextRequest) {
  const parsed = schema.safeParse({
    fromLat: request.nextUrl.searchParams.get("fromLat"),
    fromLng: request.nextUrl.searchParams.get("fromLng"),
    toLat: request.nextUrl.searchParams.get("toLat"),
    toLng: request.nextUrl.searchParams.get("toLng")
  });
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid coordinates" }, { status: 400 });
  }
  const { fromLat, fromLng, toLat, toLng } = parsed.data;

  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${fromLng},${fromLat};${toLng},${toLat}?overview=full&geometries=geojson`;
    const response = await fetch(url, {
      headers: { Accept: "application/json" },
      // Route can change slightly as OSRM re-evaluates, but the road network
      // itself doesn't — a short cache smooths out rider-location jitter
      // without making every GPS tick hit the public router.
      next: { revalidate: 15 }
    });

    if (!response.ok) {
      return NextResponse.json({ error: "Routing service unavailable" }, { status: 502 });
    }

    const data = await response.json();
    const route = data?.routes?.[0];
    const coordinates = route?.geometry?.coordinates as [number, number][] | undefined;

    if (!coordinates || coordinates.length < 2) {
      return NextResponse.json({ error: "No route found" }, { status: 404 });
    }

    return NextResponse.json({
      coordinates,
      distanceMetres: route.distance ?? null,
      durationSeconds: route.duration ?? null
    });
  } catch (error) {
    console.error("Road routing failed:", error);
    return NextResponse.json({ error: "Routing failed" }, { status: 500 });
  }
}
