import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { auth } from "@/auth";
import { writeAuditLog } from "@/lib/audit";
import { requireProductStaff } from "@/lib/authz";
import { normalizeProductSheetRow, upsertProductSheetRows } from "@/lib/admin-product-bulk";

export async function PATCH(request: Request) {
  try {
    const session = await auth();
    const unauthorized = requireProductStaff(session);
    if (unauthorized) return unauthorized;
    const body = await request.json();
    const rawRows: unknown[] = Array.isArray(body.rows) ? body.rows : [];
    if (rawRows.length === 0) return NextResponse.json({ error: "No product rows supplied." }, { status: 400 });

    const rows = rawRows.map((row) => normalizeProductSheetRow(row as Record<string, unknown>));
    const result = await upsertProductSheetRows(rows);
    if (result.errors.length > 0) return NextResponse.json({ error: "Some rows are invalid.", ...result }, { status: 400 });

    revalidateTag("products");
    revalidateTag("homepage");
    await writeAuditLog({
      actorId: session?.user?.id,
      actorRole: session?.user?.role,
      action: "products_bulk_updated",
      targetType: "Product",
      targetId: "bulk",
      metadata: { rowCount: rows.length }
    });
    return NextResponse.json(result);
  } catch (error) {
    console.error("Product bulk update failed", error);
    return NextResponse.json({ error: "Products could not be saved." }, { status: 500 });
  }
}
