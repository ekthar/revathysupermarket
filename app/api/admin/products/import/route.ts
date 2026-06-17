import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import * as XLSX from "xlsx";
import { auth } from "@/auth";
import { writeAuditLog } from "@/lib/audit";
import { requireProductStaff } from "@/lib/authz";
import { normalizeProductSheetRow, upsertProductSheetRows, validateProductSheetRow } from "@/lib/admin-product-bulk";

function parseRows(buffer: ArrayBuffer, filename: string) {
  const workbook = XLSX.read(Buffer.from(buffer), { type: "buffer" });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  return XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" }).map(normalizeProductSheetRow);
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    const unauthorized = requireProductStaff(session);
    if (unauthorized) return unauthorized;
    const formData = await request.formData();
    const file = formData.get("file");
    const commit = formData.get("commit") === "true";
    if (!(file instanceof File)) return NextResponse.json({ error: "Upload an XLSX or CSV file." }, { status: 400 });

    const rows = parseRows(await file.arrayBuffer(), file.name);
    const preview = rows.map((row, index) => ({ row: index + 1, product: row, errors: validateProductSheetRow(row) }));
    const invalidRows = preview.filter((row) => row.errors.length > 0);

    if (!commit) return NextResponse.json({ preview, invalidRows });
    if (invalidRows.length > 0) return NextResponse.json({ error: "Fix invalid rows before importing.", preview, invalidRows }, { status: 400 });

    const result = await upsertProductSheetRows(rows);
    if (result.errors.length > 0) return NextResponse.json({ error: "Some rows are invalid.", ...result }, { status: 400 });
    revalidateTag("products");
    revalidateTag("homepage");
    await writeAuditLog({
      actorId: session?.user?.id,
      actorRole: session?.user?.role,
      action: "products_imported",
      targetType: "Product",
      targetId: "bulk",
      metadata: { filename: file.name, rowCount: rows.length }
    });
    return NextResponse.json(result);
  } catch (error) {
    console.error("Product import failed", error);
    return NextResponse.json({ error: "Product file could not be imported." }, { status: 500 });
  }
}
