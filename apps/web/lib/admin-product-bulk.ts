import { prisma } from "@/lib/prisma";
import { PRODUCT_IMAGE_FALLBACK, isAllowedProductImageUrl, safeProductImageUrl } from "@/lib/image";
import { slugify } from "@/lib/utils";

export type ProductSheetRow = {
  id?: string;
  slug?: string;
  active?: boolean;
  featured?: boolean;
  name: string;
  category: string;
  price: number;
  discountPrice?: number | null;
  costPrice?: number | null;
  gstRate?: number | null;
  brand?: string | null;
  stock: number;
  unit?: string;
  image?: string | null;
  description: string;
};

export const productSheetColumns = [
  "id",
  "slug",
  "active",
  "featured",
  "name",
  "category",
  "price",
  "discountPrice",
  "costPrice",
  "gstRate",
  "brand",
  "stock",
  "unit",
  "image",
  "description"
] as const;

/** Simplified template columns for bulk import (no id/slug/active/featured) */
export const productTemplateColumns = [
  "name",
  "category",
  "price",
  "discountPrice",
  "costPrice",
  "gstRate",
  "stock",
  "unit",
  "brand",
  "image",
  "description"
] as const;

export function normalizeProductSheetRow(input: Record<string, unknown>): ProductSheetRow {
  const activeValue = input.active ?? input.Active ?? input.isActive ?? input["Is Active"];
  const featuredValue = input.featured ?? input.Featured ?? input.isFeatured ?? input["Is Featured"];
  const discountValue = input.discountPrice ?? input["Discount Price"] ?? input.discount_price ?? input["Discounted Rate"];
  const costPriceValue = input.costPrice ?? input["Cost Price"] ?? input.cost_price ?? input["costprice"];
  const gstRateValue = input.gstRate ?? input["GST Rate"] ?? input.gst_rate ?? input.GST ?? input.gst ?? input["GST %"];
  const brandValue = input.brand ?? input.Brand ?? input["brand"];
  const image = String(input.image ?? input.Image ?? "").trim();

  return {
    id: String(input.id ?? input.ID ?? "").trim() || undefined,
    slug: String(input.slug ?? input.Slug ?? "").trim() || undefined,
    active:
      typeof activeValue === "boolean"
        ? activeValue
        : !["false", "0", "no", "inactive"].includes(String(activeValue ?? "true").trim().toLowerCase()),
    featured:
      typeof featuredValue === "boolean"
        ? featuredValue
        : ["true", "1", "yes", "featured"].includes(String(featuredValue ?? "false").trim().toLowerCase()),
    name: String(input.name ?? input.Name ?? input["Product Name"] ?? "").trim(),
    category: String(input.category ?? input.Category ?? "").trim(),
    price: Number(input.price ?? input.Price ?? input.Rate ?? input.rate ?? 0),
    discountPrice: discountValue === undefined || discountValue === "" || discountValue === null ? null : Number(discountValue),
    costPrice: costPriceValue === undefined || costPriceValue === "" || costPriceValue === null ? null : Number(costPriceValue),
    gstRate: gstRateValue === undefined || gstRateValue === "" || gstRateValue === null ? null : Number(gstRateValue),
    brand: brandValue ? String(brandValue).trim() : null,
    stock: Number(input.stock ?? input.Stock ?? 0),
    unit: String(input.unit ?? input.Unit ?? "1 pc").trim() || "1 pc",
    image: image || null,
    description: String(input.description ?? input.Description ?? "").trim()
  };
}

export function validateProductSheetRow(row: ProductSheetRow) {
  const errors: string[] = [];
  if (!row.name || row.name.length < 2) errors.push("Product name is required.");
  if (!row.category || row.category.length < 2) errors.push("Category is required.");
  if (!Number.isFinite(row.price) || row.price <= 0) errors.push("Price must be greater than 0.");
  if (row.discountPrice !== null && row.discountPrice !== undefined && (!Number.isFinite(row.discountPrice) || row.discountPrice <= 0)) {
    errors.push("Discount price must be greater than 0.");
  }
  if (!Number.isInteger(row.stock) || row.stock < 0) errors.push("Stock must be a whole number 0 or above.");
  if (!row.description || row.description.length < 10) errors.push("Description must be at least 10 characters.");
  if (row.image && !isAllowedProductImageUrl(row.image)) errors.push("Image must be a valid HTTPS URL or blank.");
  return errors;
}

async function uniqueProductSlug(name: string, currentId?: string, preferredSlug?: string) {
  const baseSlug = slugify(preferredSlug || name) || "product";
  let slug = baseSlug;
  let suffix = 2;

  while (true) {
    const existing = await prisma.product.findUnique({ where: { slug }, select: { id: true } });
    if (!existing || existing.id === currentId) return slug;
    slug = `${baseSlug}-${suffix}`;
    suffix += 1;
  }
}

async function findExistingProduct(row: ProductSheetRow) {
  if (row.id) {
    const product = await prisma.product.findUnique({ where: { id: row.id }, select: { id: true } });
    if (product) return product;
  }
  if (row.slug) {
    const product = await prisma.product.findUnique({ where: { slug: row.slug }, select: { id: true } });
    if (product) return product;
  }
  return prisma.product.findFirst({ where: { name: { equals: row.name, mode: "insensitive" } }, select: { id: true } });
}

export async function upsertProductSheetRows(rows: ProductSheetRow[]) {
  const results: Array<{ name: string; action: "created" | "updated"; id: string }> = [];
  const errors: Array<{ row: number; errors: string[] }> = [];

  for (const [index, row] of rows.entries()) {
    const rowErrors = validateProductSheetRow(row);
    if (rowErrors.length > 0) {
      errors.push({ row: index + 1, errors: rowErrors });
      continue;
    }

    const categorySlug = slugify(row.category);
    const category = await prisma.category.upsert({
      where: { slug: categorySlug },
      update: { name: row.category },
      create: { slug: categorySlug, name: row.category }
    });
    const existing = await findExistingProduct(row);
    const slug = await uniqueProductSlug(row.name, existing?.id, row.slug);
    const image = row.image ? safeProductImageUrl(row.image) : PRODUCT_IMAGE_FALLBACK;
    const data = {
      name: row.name,
      slug,
      categoryId: category.id,
      price: row.price,
      discountPrice: row.discountPrice || undefined,
      costPrice: row.costPrice || undefined,
      gstRate: row.gstRate != null ? row.gstRate : undefined,
      brand: row.brand || undefined,
      stock: row.stock,
      unit: row.unit || "1 pc",
      image,
      description: row.description,
      isActive: row.active ?? true,
      isFeatured: row.featured ?? false
    };

    if (existing) {
      const product = await prisma.product.update({ where: { id: existing.id }, data, select: { id: true, name: true } });
      results.push({ id: product.id, name: product.name, action: "updated" });
    } else {
      const product = await prisma.product.create({ data, select: { id: true, name: true } });
      results.push({ id: product.id, name: product.name, action: "created" });
    }
  }

  return { results, errors };
}
