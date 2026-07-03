import { NextResponse } from "next/server";
import ExcelJS from "exceljs";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { requireReportStaff } from "@/lib/authz";
import { productSheetColumns, productTemplateColumns } from "@/lib/admin-product-bulk";

function csvCell(value: unknown) {
  return `"${String(value ?? "").replace(/"/g, '""')}"`;
}

const templateExampleRows = [
  {
    name: "Robusta Banana",
    category: "Fruits",
    mrp: 72,
    salesPrice: 64,
    costPrice: 50,
    gstRate: 5,
    stock: 42,
    unit: "kg",
    brand: "Fresh Farm",
    image: "",
    description: "Sweet Kerala bananas selected for daily freshness."
  },
  {
    name: "Milma Milk",
    category: "Dairy",
    mrp: 34,
    salesPrice: "",
    costPrice: 28,
    gstRate: 0,
    stock: 100,
    unit: "500 ml",
    brand: "Milma",
    image: "",
    description: "Fresh toned milk for daily use."
  },
  {
    name: "Kerala Banana Chips",
    category: "Snacks",
    mrp: 95,
    salesPrice: 88,
    costPrice: 60,
    gstRate: 12,
    stock: 48,
    unit: "200 g",
    brand: "",
    image: "",
    description: "Crispy banana chips fried in coconut oil."
  }
];

export async function GET(request: Request) {
  const session = await auth();
  const unauthorized = requireReportStaff(session);
  if (unauthorized) return unauthorized;

  const url = new URL(request.url);
  const formatParam = url.searchParams.get("format") ?? "xlsx";

  // Template mode: return headers + example rows (no real data)
  if (formatParam === "template") {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Product Template");
    sheet.columns = productTemplateColumns.map((col) => ({ header: col, key: col, width: 18 }));
    sheet.addRows(templateExampleRows);
    sheet.views = [{ state: "frozen", ySplit: 1 }];
    sheet.getRow(1).font = { bold: true };

    // Fetch and append allowed values for user reference.
    const [categories, units] = await Promise.all([
      prisma.category.findMany({ select: { name: true }, orderBy: { name: "asc" } }),
      prisma.unit.findMany({ select: { name: true }, orderBy: { name: "asc" } }).catch(() => []),
    ]);
    const allowedGst = [0, 3, 5, 12, 40];
    const suggestedUnits = units.length > 0
      ? units.map((unit) => unit.name)
      : ["pcs", "10 nos", "kg", "500 g", "250 g", "100 g", "L", "500 ml", "250 ml", "packet", "box", "bundle"];
    const refSheet = workbook.addWorksheet("Allowed Values");
    refSheet.columns = [
      { header: "Allowed Categories", key: "category", width: 25 },
      { header: "Allowed GST Rates (%)", key: "gst", width: 25 },
      { header: "Suggested Units", key: "unit", width: 25 }
    ];
    const maxLength = Math.max(categories.length, allowedGst.length, suggestedUnits.length);
    for (let i = 0; i < maxLength; i++) {
      refSheet.addRow({
        category: categories[i]?.name ?? "",
        gst: allowedGst[i] !== undefined ? allowedGst[i] : "",
        unit: suggestedUnits[i] ?? ""
      });
    }
    refSheet.getRow(1).font = { bold: true };

    const buffer = await workbook.xlsx.writeBuffer();
    return new Response(Buffer.from(buffer), {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": "attachment; filename=product-import-template.xlsx"
      }
    });
  }

  // Full export
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
      costPrice: true,
      gstRate: true,
      brand: true,
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
    mrp: Number(product.price),
    salesPrice: product.discountPrice != null ? Number(product.discountPrice) : "",
    costPrice: product.costPrice != null ? Number(product.costPrice) : "",
    gstRate: product.gstRate != null ? Number(product.gstRate) : "",
    brand: product.brand ?? "",
    stock: product.stock,
    unit: product.unit,
    image: product.image,
    description: product.description
  }));

  if (formatParam === "csv") {
    const csv = [
      productSheetColumns.join(","),
      ...rows.map((row) => productSheetColumns.map((column) => csvCell(row[column as keyof typeof row])).join(","))
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
