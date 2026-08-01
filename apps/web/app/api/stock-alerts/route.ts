import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { enforceRateLimit, rateLimitResponse } from "@/lib/distributed-rate-limit";

const bodySchema = z.object({
  productId: z.string().min(1).max(64),
});

/**
 * POST /api/stock-alerts — register interest in an out-of-stock product.
 *
 * Requires a session: a restock alert is only useful if we have a channel to
 * reach the customer on, and the session gives us that without asking for a
 * phone number on the card.
 *
 * Idempotent — re-registering is a no-op rather than an error, so a double tap
 * doesn't surface a failure to the customer.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json(
        { error: "Sign in to get restock alerts.", code: "UNAUTHENTICATED" },
        { status: 401 }
      );
    }

    const limit = await enforceRateLimit(`stock-alert:${userId}`, 20, 60);
    if (limit.limited) return rateLimitResponse(limit.reset);

    const parsed = bodySchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request." }, { status: 400 });
    }

    const product = await prisma.product.findUnique({
      where: { id: parsed.data.productId },
      select: { id: true, stock: true, isActive: true },
    });

    if (!product || !product.isActive) {
      return NextResponse.json({ error: "Product not found." }, { status: 404 });
    }

    // Already back in stock — tell the client so it can refresh instead of
    // queueing an alert that would fire immediately.
    if (product.stock > 0) {
      return NextResponse.json({ status: "in_stock" });
    }

    await prisma.stockAlert.upsert({
      where: { productId_userId: { productId: product.id, userId } },
      create: { productId: product.id, userId },
      // Clearing notifiedAt re-arms a previously fired alert.
      update: { notifiedAt: null },
    });

    return NextResponse.json({ status: "subscribed" });
  } catch (error) {
    console.error("Stock alert error", error);
    return NextResponse.json({ error: "Could not register alert." }, { status: 500 });
  }
}
