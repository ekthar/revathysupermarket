/**
 * Stock Management — Auto-decrement on order, restore on cancellation
 * ═══════════════════════════════════════════════════════════════════
 *
 * Called from order placement and cancellation flows.
 * Uses atomic Prisma operations to prevent race conditions.
 */

import { prisma } from "@/lib/prisma";

interface StockItem {
  productId: string;
  quantity: number;
}

/**
 * Decrement stock for ordered items.
 * Called when an order is successfully placed.
 * Uses a transaction to ensure atomicity.
 */
export async function decrementStock(items: StockItem[]): Promise<{ success: boolean; errors: string[] }> {
  const errors: string[] = [];

  try {
    await prisma.$transaction(
      items.map((item) =>
        prisma.product.update({
          where: { id: item.productId },
          data: {
            stock: { decrement: item.quantity },
            popularity: { increment: 1 },
          },
        })
      )
    );
    return { success: true, errors: [] };
  } catch (error) {
    errors.push(`Stock update failed: ${error instanceof Error ? error.message : "Unknown error"}`);
    return { success: false, errors };
  }
}

/**
 * Restore stock for cancelled/returned items.
 * Called when an order is cancelled or items are returned.
 */
export async function restoreStock(items: StockItem[]): Promise<{ success: boolean; errors: string[] }> {
  const errors: string[] = [];

  try {
    await prisma.$transaction(
      items.map((item) =>
        prisma.product.update({
          where: { id: item.productId },
          data: {
            stock: { increment: item.quantity },
          },
        })
      )
    );
    return { success: true, errors: [] };
  } catch (error) {
    errors.push(`Stock restore failed: ${error instanceof Error ? error.message : "Unknown error"}`);
    return { success: false, errors };
  }
}

/**
 * Check if all items have sufficient stock.
 * Called before order placement to prevent overselling.
 */
export async function checkStockAvailability(items: StockItem[]): Promise<{
  available: boolean;
  outOfStock: { productId: string; requested: number; available: number }[];
}> {
  const outOfStock: { productId: string; requested: number; available: number }[] = [];

  const products = await prisma.product.findMany({
    where: { id: { in: items.map((i) => i.productId) } },
    select: { id: true, stock: true, name: true },
  });

  const stockMap = new Map(products.map((p) => [p.id, p.stock]));

  for (const item of items) {
    const currentStock = stockMap.get(item.productId) ?? 0;
    if (currentStock < item.quantity) {
      outOfStock.push({
        productId: item.productId,
        requested: item.quantity,
        available: currentStock,
      });
    }
  }

  return { available: outOfStock.length === 0, outOfStock };
}
