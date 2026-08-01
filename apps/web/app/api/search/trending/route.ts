import { NextResponse } from "next/server";
import { getTrendingSearchTerms, FALLBACK_TRENDING_TERMS } from "@/lib/trending-searches";
import { getCacheHeaders } from "@/lib/api-cache-headers";

// GET /api/search/trending — popular search terms derived from real order data.
// Consumed by the global search sheet, which is mounted from the layout header
// and therefore has no server props to receive them through.
export async function GET() {
  try {
    const terms = await getTrendingSearchTerms();
    return NextResponse.json({ terms }, { headers: getCacheHeaders("products") });
  } catch {
    return NextResponse.json(
      { terms: FALLBACK_TRENDING_TERMS },
      { headers: getCacheHeaders("products") }
    );
  }
}
