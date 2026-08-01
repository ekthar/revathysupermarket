import { NextResponse } from "next/server";
import { getTrendingSearchTerms, FALLBACK_TRENDING_TERMS } from "@/lib/trending-searches";
import { getCategoryNav } from "@/lib/categories";
import { getCacheHeaders } from "@/lib/api-cache-headers";

// GET /api/search/trending — bootstrap data for the search sheet.
//
// Returns popular terms derived from real order demand, plus the category list so
// the sheet can offer category scoping ("Fruits" → /category/fruits) without a
// second round trip. The sheet is mounted from the layout header and so has no
// server props to receive either through.
export async function GET() {
  try {
    const [terms, nav] = await Promise.all([getTrendingSearchTerms(), getCategoryNav()]);

    return NextResponse.json(
      {
        terms,
        categories: nav.map((category) => ({ name: category.name, slug: category.slug })),
      },
      { headers: getCacheHeaders("products") }
    );
  } catch {
    return NextResponse.json(
      { terms: FALLBACK_TRENDING_TERMS, categories: [] },
      { headers: getCacheHeaders("products") }
    );
  }
}
