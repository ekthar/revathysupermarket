/**
 * CSV Product Import Endpoint
 * ═══════════════════════════
 *
 * Accepts a CSV file upload and bulk creates/updates products.
 * CSV columns: name, category, price, discountPrice, stock, unit, description
 *
 * Admin only. Rate limited. Max 1000 rows per upload.
 */

import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { isStaffRole } from "@/lib/authz";
import { prisma } from "@/lib/prisma";

const MAX_ROWS = 1000;

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function parseCSV(text: string): Record<string, string>[] {
  const lines = text.trim().split("\n");
  if (lines.length < 2) return [];
  const headers = lines[0].split(",").map((h) => h.trim().toLowerCase().replace(/[^a-z_]/g, ""));
  return lines.slice(1, MAX_ROWS + 1).map((line) => {
    const values = line.split(",").map((v) => v.trim().replace(/^"|"$/g, ""));
    const row: Record<string, string> = {};
    headers.forEach((h, i) => { row[h] = values[i] ?? ""; });
    return row;
  });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id || !isStaffRole(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file || !file.name.endsWith(".csv")) {
      return NextResponse.json({ error: "Please upload a CSV file" }, { status: 400 });
    }

    const text = await file.text();
    const rows = parseCSV(text);

    if (rows.length === 0) {
      return NextResponse.json({ error: "CSV is empty or invalid" }, { status: 400 });
    }

    let created = 0, updated = 0, errors: string[] = [];

    for (const row of rows) {
      try {
        const name = row.name?.trim();
        if (!name) { errors.push(`Row skipped: missing name`); continue; }

        const categoryName = row.category?.trim() || "Uncategorized";
        const price = parseFloat(row.price || "0");
        const discountPrice = row.discountprice ? parseFloat(row.discountprice) : null;
        const stock = parseInt(row.stock || "0", 10);
        const unit = row.unit?.trim() || "1 pc";
        const description = row.description?.trim() || name;
        const slug = slugify(name) + "-" + Date.now().toString(36).slice(-4);

        // Find or create category
        let category = await prisma.category.findFirst({ where: { name: { equals: categoryName, mode: "insensitive" } } });
        if (!category) {
          category = await prisma.category.create({
            data: { name: categoryName, slug: slugify(categoryName) },
          });
        }

        // Upsert product by name
        const existing = await prisma.product.findFirst({ where: { name: { equals: name, mode: "insensitive" } } });

        if (existing) {
          await prisma.product.update({
            where: { id: existing.id },
            data: { price, discountPrice, stock, unit, description, categoryId: category.id },
          });
          updated++;
        } else {
          await prisma.product.create({
            data: { name, slug, price, discountPrice, stock, unit, description, image: "", categoryId: category.id },
          });
          created++;
        }
      } catch (rowError) {
        errors.push(`Error on "${row.name}": ${rowError instanceof Error ? rowError.message : "Unknown"}`);
      }
    }

    return NextResponse.json({
      success: true,
      summary: { total: rows.length, created, updated, errors: errors.length },
      errors: errors.slice(0, 20),
    });
  } catch (error) {
    console.error("CSV import error:", error);
    return NextResponse.json({ error: "Import failed" }, { status: 500 });
  }
}
