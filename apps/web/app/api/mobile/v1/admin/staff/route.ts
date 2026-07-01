import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateMobileRequest } from "@/lib/mobile-auth";

/**
 * GET /api/mobile/v1/admin/staff
 * List all staff members with permissions.
 */
export async function GET(request: Request) {
  const auth = authenticateMobileRequest(request);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!["ADMIN", "OWNER", "MANAGER"].includes(auth.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const staff = await prisma.user.findMany({
    where: {
      role: { in: ["STAFF", "PACKING_STAFF", "DELIVERY_PARTNER", "MANAGER"] },
    },
    select: {
      id: true,
      name: true,
      phone: true,
      role: true,
      isActive: true,
      vehicleInfo: true,
      createdAt: true,
      staffPermissions: {
        select: { id: true, permission: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ staff });
}

/**
 * POST /api/mobile/v1/admin/staff
 * Create a new staff member.
 */
export async function POST(request: Request) {
  const auth = authenticateMobileRequest(request);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!["ADMIN", "OWNER", "MANAGER"].includes(auth.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const { name, phone, role, vehicleInfo } = body;

  if (!name || !phone || !role) {
    return NextResponse.json({ error: "Missing required fields: name, phone, role" }, { status: 400 });
  }

  const validRoles = ["STAFF", "PACKING_STAFF", "DELIVERY_PARTNER", "MANAGER"];
  if (!validRoles.includes(role)) {
    return NextResponse.json({ error: `Invalid role. Must be one of: ${validRoles.join(", ")}` }, { status: 400 });
  }

  // Check if phone already exists
  const existing = await prisma.user.findUnique({ where: { phone } });
  if (existing) {
    return NextResponse.json({ error: "A user with this phone number already exists" }, { status: 409 });
  }

  const user = await prisma.user.create({
    data: {
      name,
      phone,
      role,
      vehicleInfo: vehicleInfo || null,
      passwordHash: null, // OTP-based login
      isActive: true,
    },
  });

  return NextResponse.json({ user }, { status: 201 });
}
