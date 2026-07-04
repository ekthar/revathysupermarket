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
  "mrp",
  "salesPrice",
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
  "mrp",
  "salesPrice",
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
  const discountValue = input.salesPrice ?? input.SalesPrice ?? input["Sales Price"] ?? input.discountPrice ?? input["Discount Price"] ?? input.discount_price ?? input["Discounted Rate"];
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
    price: Number(input.mrp ?? input.MRP ?? input.price ?? input.Price ?? input.Rate ?? input.rate ?? 0),
    discountPrice: discountValue === undefined || discountValue === "" || discountValue === null ? null : Number(discountValue),
    costPrice: costPriceValue === undefined || costPriceValue === "" || costPriceValue === null ? null : Number(costPriceValue),
    gstRate: gstRateValue === undefined || gstRateValue === "" || gstRateValue === null ? null : Number(gstRateValue),
    brand: brandValue ? String(brandValue).trim() : null,
    stock: Number(input.stock ?? input.Stock ?? 0),
    unit: String(input.unit ?? input.Unit ?? "pcs").trim() || "pcs",
    image: image || null,
    description: String(input.description ?? input.Description ?? "").trim()
  };
}

const NUMBERS_ONLY = /^[\d.,%\s]+$/;
const MAX_REASONABLE_LABEL_LENGTH = 40;
const VALID_GST_RATES = [0, 3, 5, 18, 40];

function looksGarbled(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) return false;
  if (NUMBERS_ONLY.test(trimmed)) return true;
  if (!/[a-zA-Z]/.test(trimmed)) return true;
  if (trimmed.length > MAX_REASONABLE_LABEL_LENGTH) return true;
  return false;
}

export type ImportValidContext = {
  categoryNames: Set<string>;
  unitNames: Set<string>;
};

export async function fetchImportValidContext(): Promise<ImportValidContext> {
  const [categories, units] = await Promise.all([
    prisma.category.findMany({ select: { name: true } }),
    prisma.unit.findMany({ select: { name: true } }),
  ]);
  return {
    categoryNames: new Set(categories.map((c) => c.name.toLowerCase())),
    unitNames: new Set(units.map((u) => u.name.toLowerCase())),
  };
}

export function validateProductSheetRow(row: ProductSheetRow, ctx?: ImportValidContext) {
  const errors: string[] = [];
  if (!row.name || row.name.length < 2) errors.push("Name error: product name is required.");
  if (!row.category || row.category.length < 2) {
    errors.push("Category error: category name is required.");
  } else if (looksGarbled(row.category)) {
    errors.push(`Category error: "${row.category}" doesn't look like a valid category name.`);
  } else if (ctx && !ctx.categoryNames.has(row.category.toLowerCase())) {
    errors.push(`Category error: "${row.category}" is not a known category. Create it in the admin panel first.`);
  }
  if (!Number.isFinite(row.price) || row.price <= 0) errors.push("Price error: MRP must be greater than 0.");
  if (row.discountPrice !== null && row.discountPrice !== undefined && (!Number.isFinite(row.discountPrice) || row.discountPrice <= 0)) {
    errors.push("Price error: sales price must be greater than 0.");
  }
  if (row.discountPrice != null && row.price > 0 && row.discountPrice >= row.price) {
    errors.push("Price error: sales price must be less than MRP.");
  }
  if (row.gstRate != null) {
    if (!Number.isFinite(row.gstRate)) {
      errors.push("GST error: GST rate must be a number.");
    } else if (!VALID_GST_RATES.includes(row.gstRate)) {
      errors.push(`GST error: ${row.gstRate}% is not a valid GST rate (must be 0, 3, 5, 18, or 40).`);
    }
  }
  if (!Number.isInteger(row.stock) || row.stock < 0) errors.push("Stock error: stock must be a whole number 0 or above.");
  if (row.unit && looksGarbled(row.unit)) {
    errors.push(`Unit error: "${row.unit}" doesn't look like a valid unit.`);
  } else if (row.unit && ctx && !ctx.unitNames.has(row.unit.toLowerCase())) {
    errors.push(`Unit error: "${row.unit}" is not a known unit. Create it in the admin panel first.`);
  }
  if (!row.description || row.description.length < 10) errors.push("Description error: description must be at least 10 characters.");
  if (row.image && !isAllowedProductImageUrl(row.image)) errors.push("Image error: image must be a valid HTTPS URL or blank.");
  return errors;
}

export async function ensureProductUnits(units: Array<string | null | undefined>) {
  const names = [...new Set(units.map((unit) => unit?.trim()).filter((unit): unit is string => Boolean(unit)))];
  if (names.length === 0) return;

  await prisma.unit.createMany({
    data: names.map((name) => ({ name })),
    skipDuplicates: true
  });
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

const categoryBySlugCache = new Map<string, { id: string; name: string; slug: string } | null>();

async function resolveCategory(row: ProductSheetRow): Promise<{ id: string; name: string; slug: string } | null> {
  const slug = slugify(row.category);
  const cached = categoryBySlugCache.get(slug);
  if (cached !== undefined) return cached;
  const category = await prisma.category.findUnique({ where: { slug } });
  categoryBySlugCache.set(slug, category);
  return category;
}

export async function upsertProductSheetRows(rows: ProductSheetRow[], ctx?: ImportValidContext) {
  const results: Array<{ name: string; action: "created" | "updated"; id: string }> = [];
  const errors: Array<{ row: number; errors: string[] }> = [];
  const validRows: ProductSheetRow[] = [];

  const validCtx = ctx ?? await fetchImportValidContext();

  for (const [index, row] of rows.entries()) {
    const rowErrors = validateProductSheetRow(row, validCtx);
    if (rowErrors.length > 0) {
      errors.push({ row: index + 1, errors: rowErrors });
      continue;
    }
    validRows.push(row);
  }

  categoryBySlugCache.clear();

  for (const row of validRows) {
    const category = await resolveCategory(row);
    if (!category) {
      errors.push({ row: 0, errors: [`Category "${row.category}" no longer exists in the database.`] });
      continue;
    }
    const existing = await findExistingProduct(row);
    const slug = await uniqueProductSlug(row.name, existing?.id, row.slug);
    const image = row.image ? safeProductImageUrl(row.image) : PRODUCT_IMAGE_FALLBACK;
    const data = {
      name: row.name,
      slug,
      categoryId: category.id,
      price: row.price,
      discountPrice: row.discountPrice != null ? row.discountPrice : undefined,
      costPrice: row.costPrice != null ? row.costPrice : undefined,
      gstRate: row.gstRate != null ? row.gstRate : undefined,
      brand: row.brand || undefined,
      stock: row.stock,
      unit: row.unit || "pcs",
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
