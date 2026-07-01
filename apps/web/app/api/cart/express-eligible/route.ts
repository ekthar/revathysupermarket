import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { isWithinDeliveryRadius } from "@/lib/distance";
import { SITE } from "@/lib/constants";

// GET /api/cart/express-eligible
// Checks if the current user is eligible for express/one-tap checkout:
// - Has a default address within delivery radius
// - Has completed at least 1 order
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ eligible: false });
  }

  try {
    // Check if user has at least one completed order
    const completedOrder = await prisma.order.findFirst({
      where: {
        userId: session.user.id,
        status: "DELIVERED",
      },
      select: { id: true },
    });

    if (!completedOrder) {
      return NextResponse.json({ eligible: false });
    }

    // Check if user has a default address
    const defaultAddress = await prisma.address.findFirst({
      where: {
        userId: session.user.id,
        isDefault: true,
      },
      select: {
        id: true,
        label: true,
        houseName: true,
        street: true,
        pincode: true,
        latitude: true,
        longitude: true,
      },
    });

    if (!defaultAddress || !defaultAddress.latitude || !defaultAddress.longitude) {
      return NextResponse.json({ eligible: false });
    }

    // Validate that the default address is within delivery radius
    const withinRadius = isWithinDeliveryRadius(
      { lat: Number(defaultAddress.latitude), lng: Number(defaultAddress.longitude) },
      SITE.deliveryRadiusKm
    );

    if (!withinRadius) {
      return NextResponse.json({ eligible: false });
    }

    // Get user's last used payment method from their most recent order
    const lastOrder = await prisma.order.findFirst({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      select: { paymentMethod: true },
    });

    return NextResponse.json({
      eligible: true,
      address: {
        id: defaultAddress.id,
        label: defaultAddress.label,
        houseName: defaultAddress.houseName,
        street: defaultAddress.street,
        pincode: defaultAddress.pincode,
        latitude: defaultAddress.latitude,
        longitude: defaultAddress.longitude,
      },
      paymentMethod: lastOrder?.paymentMethod || "COD",
    });
  } catch {
    return NextResponse.json({ eligible: false });
  }
}
