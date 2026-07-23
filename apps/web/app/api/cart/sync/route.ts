import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/cart/sync — Background cart synchronization endpoint.
 *
 * Receives a batch of cart mutations and applies them to the server-side
 * saved cart for the authenticated user. Used for cross-device persistence.
 *
 * Mutations are applied in order. Conflicts (e.g., product out of stock)
 * are silently resolved — the next cart hydration will reconcile.
 *
 * This endpoint is called by the CartSyncQueue in the background.
 * It should NEVER block the user — errors are retried automatically.
 */

type CartMutation =
  | { type: "add"; productId: string; quantity: number }
  | { type: "remove"; productId: string }
  | { type: "update"; productId: string; quantity: number }
  | { type: "clear" };

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const mutations = body.mutations as CartMutation[];

    if (!Array.isArray(mutations) || mutations.length === 0) {
      return NextResponse.json({ error: "No mutations" }, { status: 400 });
    }

    // Apply mutations to the user's saved cart
    const userId = session.user.id;

    for (const mutation of mutations) {
      switch (mutation.type) {
        case "add": {
          // Upsert: add or increment quantity
          await prisma.savedCartItem.upsert({
            where: { userId_productId: { userId, productId: mutation.productId } },
            create: { userId, productId: mutation.productId, quantity: mutation.quantity },
            update: { quantity: { increment: mutation.quantity } },
          }).catch(() => null); // Silently skip invalid products
          break;
        }
        case "remove": {
          await prisma.savedCartItem.deleteMany({
            where: { userId, productId: mutation.productId },
          }).catch(() => null);
          break;
        }
        case "update": {
          if (mutation.quantity <= 0) {
            await prisma.savedCartItem.deleteMany({
              where: { userId, productId: mutation.productId },
            }).catch(() => null);
          } else {
            await prisma.savedCartItem.upsert({
              where: { userId_productId: { userId, productId: mutation.productId } },
              create: { userId, productId: mutation.productId, quantity: mutation.quantity },
              update: { quantity: mutation.quantity },
            }).catch(() => null);
          }
          break;
        }
        case "clear": {
          await prisma.savedCartItem.deleteMany({ where: { userId } }).catch(() => null);
          break;
        }
      }
    }

    return NextResponse.json({ ok: true, processed: mutations.length });
  } catch {
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
