import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateMobileRequest } from "@/lib/mobile-auth";

/**
 * GET /api/mobile/v1/admin/staff/[id]/permissions
 * List permissions for a staff member.
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

  const permissions = await prisma.staffPermission.findMany({
    where: { userId: id },
    select: { id: true, permission: true, grantedBy: true, createdAt: true },
  });

  return NextResponse.json({ permissions });
}

/**
 * PUT /api/mobile/v1/admin/staff/[id]/permissions
 * Replace all permissions for a staff member.
 */
export async function PUT(
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
  const { permissions } = body;

  if (!Array.isArray(permissions)) {
    return NextResponse.json({ error: "permissions must be an array of strings" }, { status: 400 });
  }

  // Delete existing permissions and create new ones in a transaction
  await prisma.$transaction([
    prisma.staffPermission.deleteMany({ where: { userId: id } }),
    ...permissions.map((permission: string) =>
      prisma.staffPermission.create({
        data: {
          userId: id,
          permission,
          grantedBy: auth.userId,
        },
      })
    ),
  ]);

  const updated = await prisma.staffPermission.findMany({
    where: { userId: id },
    select: { id: true, permission: true, grantedBy: true, createdAt: true },
  });

  return NextResponse.json({ permissions: updated });
}
