import { prisma } from '@/lib/prisma';

// --- Types ---

export interface OfferItem {
  id: string;
  title: string;
  description: string | null;
  discountType: string;
  discountValue: number;
  categoryId: string | null;
  productId: string | null;
  minQuantity: number;
  maxDiscount: number | null;
  isActive: boolean;
  startsAt: Date | null;
  expiresAt: Date | null;
  badge: string | null;
  image: string | null;
}

export interface PromoCodeItem {
  id: string;
  code: string;
  description: string | null;
  discountType: string;
  discountValue: number;
  minimumOrder: number;
  maxDiscount: number | null;
  usageLimit: number | null;
  usedCount: number;
  isActive: boolean;
  startsAt: Date | null;
  expiresAt: Date | null;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

class MarketingServiceError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 400
  ) {
    super(message);
    this.name = 'MarketingServiceError';
  }
}

// --- Service ---

export class MarketingService {
  /**
   * Get paginated offers with optional active filter.
   */
  static async getOffers(params: {
    page?: number;
    pageSize?: number;
    isActive?: boolean;
  }): Promise<PaginatedResult<OfferItem>> {
    const { page = 1, pageSize = 20, isActive } = params;
    const skip = (page - 1) * pageSize;

    const where: Record<string, unknown> = {};
    if (isActive !== undefined) where.isActive = isActive;

    try {
      const [items, total] = await Promise.all([
        prisma.offer.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip,
          take: pageSize,
        }),
        prisma.offer.count({ where }),
      ]);

      return {
        items: items.map((o) => ({
          id: o.id,
          title: o.title,
          description: o.description,
          discountType: o.discountType,
          discountValue: Number(o.discountValue),
          categoryId: o.categoryId,
          productId: o.productId,
          minQuantity: o.minQuantity,
          maxDiscount: o.maxDiscount ? Number(o.maxDiscount) : null,
          isActive: o.isActive,
          startsAt: o.startsAt,
          expiresAt: o.expiresAt,
          badge: o.badge,
          image: o.image,
        })),
        total,
        page,
        pageSize,
      };
    } catch (err) {
      throw new MarketingServiceError(
        `Failed to fetch offers: ${err instanceof Error ? err.message : 'Unknown error'}`,
        'OFFERS_FETCH_FAILED',
        500
      );
    }
  }

  /**
   * Get paginated promo codes with optional active filter.
   */
  static async getPromoCodes(params: {
    page?: number;
    pageSize?: number;
    isActive?: boolean;
  }): Promise<PaginatedResult<PromoCodeItem>> {
    const { page = 1, pageSize = 20, isActive } = params;
    const skip = (page - 1) * pageSize;

    const where: Record<string, unknown> = {};
    if (isActive !== undefined) where.isActive = isActive;

    try {
      const [items, total] = await Promise.all([
        prisma.promoCode.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip,
          take: pageSize,
        }),
        prisma.promoCode.count({ where }),
      ]);

      return {
        items: items.map((p) => ({
          id: p.id,
          code: p.code,
          description: p.description,
          discountType: p.discountType,
          discountValue: Number(p.discountValue),
          minimumOrder: Number(p.minimumOrder),
          maxDiscount: p.maxDiscount ? Number(p.maxDiscount) : null,
          usageLimit: p.usageLimit,
          usedCount: p.usedCount,
          isActive: p.isActive,
          startsAt: p.startsAt,
          expiresAt: p.expiresAt,
        })),
        total,
        page,
        pageSize,
      };
    } catch (err) {
      throw new MarketingServiceError(
        `Failed to fetch promo codes: ${err instanceof Error ? err.message : 'Unknown error'}`,
        'PROMOS_FETCH_FAILED',
        500
      );
    }
  }

  /**
   * Send a push notification broadcast to all active subscribers.
   * Returns the number of subscribers notified.
   */
  static async sendPushBroadcast(title: string, body: string): Promise<{ sent: number }> {
    if (!title || !body) {
      throw new MarketingServiceError(
        'Push notification title and body are required',
        'PUSH_INVALID_PAYLOAD',
        400
      );
    }

    try {
      // Fetch all push subscriptions
      const subscriptions = await prisma.pushSubscription.findMany({
        select: { id: true, endpoint: true, p256dh: true, auth: true, userId: true },
      });

      if (subscriptions.length === 0) {
        return { sent: 0 };
      }

      // Create notification records for all subscribers
      const userIds = Array.from(new Set(subscriptions.map((s) => s.userId)));

      await prisma.notification.createMany({
        data: userIds.map((userId) => ({
          userId,
          title,
          body,
          type: 'PUSH_BROADCAST',
        })),
        skipDuplicates: true,
      });

      // Note: Actual push delivery (web-push library calls) should be handled
      // by a background job or queue. This service records the intent and
      // creates notification records. The delivery mechanism is infrastructure-level.

      return { sent: subscriptions.length };
    } catch (err) {
      throw new MarketingServiceError(
        `Failed to send push broadcast: ${err instanceof Error ? err.message : 'Unknown error'}`,
        'PUSH_BROADCAST_FAILED',
        500
      );
    }
  }
}
