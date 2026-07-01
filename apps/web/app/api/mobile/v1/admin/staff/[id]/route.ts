import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateMobileRequest } from "@/lib/mobile-auth";

/**
 * GET /api/mobile/v1/admin/staff/[id]
 * Staff member detail with permissions.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = authenticateMobileRequest(request);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!["ADMIN", "OWNER", "MANAGER"].includes(auth.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      phone: true,
      email: true,
      role: true,
      isActive: true,
      vehicleInfo: true,
      createdAt: true,
      staffPermissions: {
        select: { id: true, permission: true, grantedBy: true, createdAt: true },
      },
    },
  });

  if (!user) {
    return NextResponse.json({ error: "Staff member not found" }, { status: 404 });
  }

  return NextResponse.json({ user });
}

/**
 * PATCH /api/mobile/v1/admin/staff/[id]
 * Update staff member (name, phone, role, isActive).
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = authenticateMobileRequest(request);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!["ADMIN", "OWNER", "MANAGER"].includes(auth.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const body = await request.json();

  const data: Record<string, unknown> = {};
  if (body.name !== undefined) data.name = body.name;
  if (body.phone !== undefined) data.phone = body.phone;
  if (body.role !== undefined) data.role = body.role;
  if (body.isActive !== undefined) data.isActive = body.isActive;
  if (body.vehicleInfo !== undefined) data.vehicleInfo = body.vehicleInfo;

  const user = await prisma.user.update({
    where: { id },
    data,
  });

  return NextResponse.json({ user });
}

/**
 * DELETE /api/mobile/v1/admin/staff/[id]
 * Deactivate staff member (soft-delete).
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = authenticateMobileRequest(request);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!["ADMIN", "OWNER", "MANAGER"].includes(auth.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  await prisma.user.update({
    where: { id },
    data: { isActive: false },
  });

  return NextResponse.json({ success: true });
}
