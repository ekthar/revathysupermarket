import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import * as XLSX from "xlsx";
import { auth } from "@/auth";
import { writeAuditLog } from "@/lib/audit";
import { requireProductStaff } from "@/lib/authz";
import { normalizeProductSheetRow, upsertProductSheetRows, validateProductSheetRow } from "@/lib/admin-product-bulk";
import { enforceRateLimit, rateLimitResponse } from "@/lib/distributed-rate-limit";

const MAX_IMPORT_BYTES = 2 * 1024 * 1024;
const MAX_IMPORT_ROWS = 2000;

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
    const limit = await enforceRateLimit(`product-import:${session!.user!.id}`, 10, 3600);
    if (limit.limited) return rateLimitResponse(limit.reset);
    const formData = await request.formData();
    const file = formData.get("file");
    const commit = formData.get("commit") === "true";
    if (!(file instanceof File)) return NextResponse.json({ error: "Upload an XLSX or CSV file." }, { status: 400 });
    if (file.size <= 0 || file.size > MAX_IMPORT_BYTES) return NextResponse.json({ error: "Product files must be smaller than 2MB.", code: "IMPORT_TOO_LARGE" }, { status: 400 });
    if (!/\.(xlsx|csv)$/i.test(file.name)) return NextResponse.json({ error: "Only XLSX and CSV files are accepted.", code: "INVALID_IMPORT_TYPE" }, { status: 400 });

    const rows = parseRows(await file.arrayBuffer(), file.name);
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
