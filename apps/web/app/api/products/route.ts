import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { products as fallbackProducts } from "@/lib/products";
import type { Product } from "@/lib/types";
import { rankResults } from "@/lib/search/relevance";
import { getCacheHeaders } from "@/lib/api-cache-headers";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const category = searchParams.get("category") || "All";
    const q = searchParams.get("q") || "";
    const sort = searchParams.get("sort") || "popularity";
    const cursor = searchParams.get("cursor") || undefined;
    const limit = Math.min(Number(searchParams.get("limit")) || 24, 100);
    const maxPrice = Number(searchParams.get("maxPrice")) || undefined;

    // Build Prisma where clause
    const where: Record<string, unknown> = { isActive: true };
    if (category && category !== "All") {
      where.category = { name: category };
    }
    if (q) {
      where.name = { contains: q, mode: "insensitive" };
    }
    if (maxPrice) {
      where.OR = [
        { discountPrice: { not: null, lte: maxPrice } },
        { discountPrice: null, price: { lte: maxPrice } },
      ];
    }

    // Build orderBy
    let orderBy: Record<string, string>[] = [{ popularity: "desc" }, { createdAt: "desc" }];
    if (sort === "low") orderBy = [{ price: "asc" }];
    else if (sort === "high") orderBy = [{ price: "desc" }];
    else if (sort === "newest") orderBy = [{ createdAt: "desc" }];

    const [dbProducts, total] = await Promise.all([
      prisma.product.findMany({
        where,
        select: {
          id: true,
          slug: true,
          name: true,
          description: true,
          image: true,
          price: true,
          discountPrice: true,
          stock: true,
          popularity: true,
          unit: true,
          isFeatured: true,
          createdAt: true,
          category: { select: { name: true } },
        },
        orderBy,
        take: limit + 1,
        ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
      }),
      prisma.product.count({ where }),
    ]).catch(() => [[], 0] as [never[], number]);

    if (Array.isArray(dbProducts) && dbProducts.length > 0) {
      const hasMore = dbProducts.length > limit;
      const baseItems = (hasMore ? dbProducts.slice(0, limit) : dbProducts).map((product) => ({
        id: product.id,
        slug: product.slug,
        name: product.name,
        category: product.category.name as Product["category"],
        price: Number(product.price),
        discountPrice: product.discountPrice ? Number(product.discountPrice) : undefined,
        image: product.image,
        description: product.description,
        stock: product.stock,
        popularity: product.popularity,
        unit: product.unit,
        isFeatured: product.isFeatured,
        createdAt: product.createdAt.toISOString(),
      }));

      // If searching and < 3 exact results, enhance with fuzzy matches
      if (q && baseItems.length < 3) {
        const fuzzyWhere: Record<string, unknown> = { isActive: true };
        if (category && category !== "All") {
          fuzzyWhere.category = { name: category };
        }
        if (maxPrice) {
          fuzzyWhere.OR = [
            { discountPrice: { not: null, lte: maxPrice } },
            { discountPrice: null, price: { lte: maxPrice } },
          ];
        }

        const additionalProducts = await prisma.product
          .findMany({
            where: fuzzyWhere,
            select: {
              id: true,
              slug: true,
              name: true,
              description: true,
              image: true,
              price: true,
              discountPrice: true,
              stock: true,
              popularity: true,
              unit: true,
              isFeatured: true,
              createdAt: true,
              category: { select: { name: true } },
            },
            take: 50,
          })
          .catch(() => []);

        const existingIds = new Set(baseItems.map((item) => item.id));
        const candidateProducts = additionalProducts
          .filter((p) => !existingIds.has(p.id))
          .map((product) => ({
            id: product.id,
            slug: product.slug,
            name: product.name,
            category: product.category.name as Product["category"],
            price: Number(product.price),
            discountPrice: product.discountPrice ? Number(product.discountPrice) : undefined,
            image: product.image,
            description: product.description,
            stock: product.stock,
            popularity: product.popularity,
            unit: product.unit,
            isFeatured: product.isFeatured,
            createdAt: product.createdAt.toISOString(),
          }));

        const fuzzyMatches = rankResults(q, candidateProducts);
        const exactScored = rankResults(q, baseItems);

        const combined = [...exactScored, ...fuzzyMatches].slice(0, limit);
        const suggestions = fuzzyMatches
          .filter((m) => m.relevanceScore > 0 && m.relevanceScore < 40)
          .slice(0, 5)
          .map((m) => m.name);

        return NextResponse.json({
          items: combined.map(({ relevanceScore, ...item }) => ({ ...item, relevanceScore })),
          nextCursor: null,
          total: combined.length,
          suggestions,
        }, { headers: getCacheHeaders("products") });
      }

      // When searching, add relevance scores to results
      if (q) {
        const scored = rankResults(q, baseItems);
        const nextCursor = hasMore ? scored[scored.length - 1]?.id ?? null : null;
        return NextResponse.json({
          items: scored.map(({ relevanceScore, ...item }) => ({ ...item, relevanceScore })),
          nextCursor,
          total,
          suggestions: [],
        }, { headers: getCacheHeaders("products") });
      }

      const nextCursor = hasMore ? baseItems[baseItems.length - 1].id : null;
      return NextResponse.json({ items: baseItems, nextCursor, total }, { headers: getCacheHeaders("products") });
    }

    // Fallback to static products with filtering
    let filtered = fallbackProducts;
    if (category && category !== "All") {
      filtered = filtered.filter((p) => p.category === category);
    }
    if (q) {
      const lower = q.toLowerCase();
      filtered = filtered.filter((p) => p.name.toLowerCase().includes(lower));
    }
    if (maxPrice) {
      filtered = filtered.filter((p) => (p.discountPrice ?? p.price) <= maxPrice);
    }

    // Sort fallback
    if (sort === "low") filtered = [...filtered].sort((a, b) => (a.discountPrice ?? a.price) - (b.discountPrice ?? b.price));
    else if (sort === "high") filtered = [...filtered].sort((a, b) => (b.discountPrice ?? b.price) - (a.discountPrice ?? a.price));
    else if (sort === "newest") filtered = [...filtered].sort((a, b) => new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime());
    else filtered = [...filtered].sort((a, b) => b.popularity - a.popularity);

    const totalFiltered = filtered.length;
    const cursorIndex = cursor ? filtered.findIndex((p) => p.id === cursor) + 1 : 0;
    const page = filtered.slice(cursorIndex, cursorIndex + limit);
    const nextCursor = cursorIndex + limit < totalFiltered ? page[page.length - 1]?.id ?? null : null;

    return NextResponse.json({ items: page, nextCursor, total: totalFiltered }, { headers: getCacheHeaders("products") });
  } catch (error) {
    console.error("Products API error", error);
    return NextResponse.json({ error: "Failed to load products." }, { status: 500 });
  }
}
