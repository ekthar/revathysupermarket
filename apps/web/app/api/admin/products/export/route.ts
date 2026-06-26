import { NextResponse } from "next/server";
import ExcelJS from "exceljs";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { requireReportStaff } from "@/lib/authz";
import { productSheetColumns } from "@/lib/admin-product-bulk";

function csvCell(value: unknown) {
  return `"${String(value ?? "").replace(/"/g, '""')}"`;
}

export async function GET(request: Request) {
  const session = await auth();
  const unauthorized = requireReportStaff(session);
  if (unauthorized) return unauthorized;
  const format = new URL(request.url).searchParams.get("format") === "csv" ? "csv" : "xlsx";
  const products = await prisma.product.findMany({
    select: {
      id: true,
      slug: true,
      isActive: true,
      isFeatured: true,
      name: true,
      category: { select: { name: true } },
      price: true,
      discountPrice: true,
      stock: true,
      unit: true,
      image: true,
      description: true
    },
    orderBy: { createdAt: "desc" }
  });
  const rows = products.map((product) => ({
    id: product.id,
    slug: product.slug,
    active: product.isActive,
    featured: product.isFeatured,
    name: product.name,
    category: product.category.name,
    price: Number(product.price),
    discountPrice: product.discountPrice ? Number(product.discountPrice) : "",
    stock: product.stock,
    unit: product.unit,
    image: product.image,
    description: product.description
  }));

  if (format === "csv") {
    const csv = [
      productSheetColumns.join(","),
      ...rows.map((row) => productSheetColumns.map((column) => csvCell(row[column])).join(","))
    ].join("\n");
    return new Response(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": "attachment; filename=msm-products.csv"
      }
    });
  }

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Products");
  sheet.columns = productSheetColumns.map((column) => ({ header: column, key: column, width: 18 }));
  sheet.addRows(rows);
  sheet.views = [{ state: "frozen", ySplit: 1 }];
  sheet.getRow(1).font = { bold: true };
  const buffer = await workbook.xlsx.writeBuffer();
  return new Response(Buffer.from(buffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": "attachment; filename=msm-products.xlsx"
    }
  });
}
