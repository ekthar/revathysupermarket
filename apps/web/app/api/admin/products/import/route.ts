import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import ExcelJS from "exceljs";
import { Readable } from "node:stream";
import { auth } from "@/auth";
import { writeAuditLog } from "@/lib/audit";
import { requireProductStaff } from "@/lib/authz";
import { normalizeProductSheetRow, upsertProductSheetRows, validateProductSheetRow } from "@/lib/admin-product-bulk";
import { enforceRateLimit, rateLimitResponse } from "@/lib/distributed-rate-limit";

const MAX_IMPORT_BYTES = 2 * 1024 * 1024;
const MAX_IMPORT_ROWS = 2000;

async function parseRows(buffer: ArrayBuffer, filename: string) {
  const workbook = new ExcelJS.Workbook();
  if (filename.toLowerCase().endsWith(".csv")) {
    await workbook.csv.read(Readable.from(Buffer.from(buffer)));
  } else {
    await workbook.xlsx.load(buffer);
  }
  const sheet = workbook.worksheets[0];
  if (!sheet) return [];
  const headers = Array.from({ length: sheet.columnCount }, (_, index) => sheet.getRow(1).getCell(index + 1).text.trim());
  const rows: Record<string, unknown>[] = [];
  for (let rowNumber = 2; rowNumber <= sheet.actualRowCount; rowNumber += 1) {
    const record: Record<string, unknown> = {};
    headers.forEach((header, index) => {
      if (header) record[header] = sheet.getRow(rowNumber).getCell(index + 1).value ?? "";
    });
    if (Object.values(record).some((value) => String(value).trim() !== "")) rows.push(record);
  }
  return rows.map(normalizeProductSheetRow);
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    const unauthorized = requireProductStaff(session);
    if (unauthorized) return unauthorized;
    const limit = await enforceRateLimit(`product-import:${session!.user!.id}`, 10, 3600);
    if (limit.limited) return rateLimitResponse(limit.reset);
    const formData = await request.formData();
    const file = formData.get("file");
    const commit = formData.get("commit") === "true";
    if (!(file instanceof File)) return NextResponse.json({ error: "Upload an XLSX or CSV file." }, { status: 400 });
    if (file.size <= 0 || file.size > MAX_IMPORT_BYTES) return NextResponse.json({ error: "Product files must be smaller than 2MB.", code: "IMPORT_TOO_LARGE" }, { status: 400 });
    if (!/\.(xlsx|csv)$/i.test(file.name)) return NextResponse.json({ error: "Only XLSX and CSV files are accepted.", code: "INVALID_IMPORT_TYPE" }, { status: 400 });

    const rows = await parseRows(await file.arrayBuffer(), file.name);
    if (rows.length > MAX_IMPORT_ROWS) return NextResponse.json({ error: `Import at most ${MAX_IMPORT_ROWS} products at a time.`, code: "IMPORT_ROW_LIMIT" }, { status: 400 });
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
