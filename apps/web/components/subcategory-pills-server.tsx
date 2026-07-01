import { prisma } from "@/lib/prisma";
import { SubcategoryPillsClient } from "@/components/subcategory-pills-client";

interface SubcategoryPillsServerProps {
  categoryName: string;
}

export async function SubcategoryPillsServer({ categoryName }: SubcategoryPillsServerProps) {
  // Resolve category name to ID
  const category = await prisma.category.findFirst({
    where: { name: categoryName },
    select: { id: true },
  }).catch(() => null);

  if (!category) return null;

  // Fetch subcategories for this category
  const subcategories = await prisma.subCategory.findMany({
    where: { categoryId: category.id },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      slug: true,
      categoryId: true,
      sortOrder: true,
    },
  }).catch(() => []);

  if (subcategories.length === 0) return null;

  return <SubcategoryPillsClient subcategories={subcategories} />;
}
