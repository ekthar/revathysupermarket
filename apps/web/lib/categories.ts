import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";
import type { Product } from "@/lib/types";

/**
 * Shared category data for the L1 rail and the /category/[slug] browse pages.
 */

export type CategoryNavItem = {
  id: string;
  name: string;
  slug: string;
  image: string | null;
  icon: string | null;
  count: number;
};

export type SubCategoryNavItem = {
  id: string;
  name: string;
  slug: string;
  count: number;
};

/** Columns every product grid needs. Kept in one place so the shape and the
 *  `toProduct` mapper below can't drift apart. */
export const PRODUCT_CARD_SELECT = {
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
} as const;

type DbProductCard = {
  id: string;
  slug: string;
  name: string;
  description: string;
  image: string;
  price: unknown;
  discountPrice: unknown;
  stock: number;
  popularity: number;
  unit: string;
  isFeatured: boolean;
  createdAt: Date;
  category: { name: string };
};

/** Maps a Prisma product row to the serialisable shape client cards expect.
 *  Decimal → number and Date → ISO string, both required to cross the
 *  server/client boundary. */
export function toProduct(row: DbProductCard): Product {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    category: row.category.name,
    price: Number(row.price),
    discountPrice: row.discountPrice ? Number(row.discountPrice) : undefined,
    image: row.image,
    description: row.description,
    stock: row.stock,
    popularity: row.popularity,
    unit: row.unit,
    isFeatured: row.isFeatured,
    createdAt: row.createdAt.toISOString(),
  };
}

/** All categories with live product counts — powers the persistent L1 rail. */
export const getCategoryNav = unstable_cache(
  async (): Promise<CategoryNavItem[]> => {
    const rows = await prisma.category
      .findMany({
        orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
        select: {
          id: true,
          name: true,
          slug: true,
          image: true,
          icon: true,
          _count: { select: { products: { where: { isActive: true } } } },
        },
      })
      .catch(() => []);

    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      slug: row.slug,
      image: row.image,
      icon: row.icon,
      count: row._count.products,
    }));
  },
  ["category-nav"],
  { revalidate: 300, tags: ["categories", "products"] }
);

export type CategoryPageData = {
  category: { id: string; name: string; slug: string; description: string | null };
  subCategories: SubCategoryNavItem[];
  products: Product[];
  total: number;
};

/**
 * Everything the category browse page renders, in one cached unit.
 *
 * `subSlug` narrows to an L2 subcategory. An unknown subSlug is ignored rather
 * than 404ing, so a stale bookmark degrades to the full category.
 */
export function getCategoryPageData(slug: string, subSlug?: string) {
  return unstable_cache(
    async (): Promise<CategoryPageData | null> => {
      const category = await prisma.category
        .findUnique({
          where: { slug },
          select: { id: true, name: true, slug: true, description: true },
        })
        .catch(() => null);

      if (!category) return null;

      const subCategoryRows = await prisma.subCategory
        .findMany({
          where: { categoryId: category.id },
          orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
          select: {
            id: true,
            name: true,
            slug: true,
            _count: { select: { products: { where: { isActive: true } } } },
          },
        })
        .catch(() => []);

      const subCategories: SubCategoryNavItem[] = subCategoryRows.map((row) => ({
        id: row.id,
        name: row.name,
        slug: row.slug,
        count: row._count.products,
      }));

      const activeSub = subSlug ? subCategories.find((s) => s.slug === subSlug) : undefined;

      const where = {
        isActive: true,
        categoryId: category.id,
        ...(activeSub ? { subCategoryId: activeSub.id } : {}),
      };

      const [rows, total] = await Promise.all([
        prisma.product.findMany({
          where,
          select: PRODUCT_CARD_SELECT,
          orderBy: [{ popularity: "desc" }, { createdAt: "desc" }],
          take: 100,
        }),
        prisma.product.count({ where }),
      ]).catch(() => [[], 0] as [DbProductCard[], number]);

      return {
        category,
        subCategories,
        products: (rows as DbProductCard[]).map(toProduct),
        total,
      };
    },
    [`category-page:${slug}:${subSlug || "all"}`],
    { revalidate: 60, tags: ["categories", "products"] }
  )();
}
