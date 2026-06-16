import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { auth } from "@/auth";
import { normalizeProductSheetRow, upsertProductSheetRows } from "@/lib/admin-product-bulk";

async function requireAdmin() {
  const session = await auth();
  return session?.user?.role === "ADMIN";
}

export async function PATCH(request: Request) {
  try {
    if (!(await requireAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const body = await request.json();
    const rawRows: unknown[] = Array.isArray(body.rows) ? body.rows : [];
    if (rawRows.length === 0) return NextResponse.json({ error: "No product rows supplied." }, { status: 400 });

    const rows = rawRows.map((row) => normalizeProductSheetRow(row as Record<string, unknown>));
    const result = await upsertProductSheetRows(rows);
    if (result.errors.length > 0) return NextResponse.json({ error: "Some rows are invalid.", ...result }, { status: 400 });

    revalidateTag("products");
    return NextResponse.json(result);
  } catch (error) {
    console.error("Product bulk update failed", error);
    return NextResponse.json({ error: "Products could not be saved." }, { status: 500 });
  }
}
