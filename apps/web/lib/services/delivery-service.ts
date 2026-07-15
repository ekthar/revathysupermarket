import { prisma } from '@/lib/prisma';
import type { CollectionStatus } from '@prisma/client';

// --- Types ---

export interface ActivePartner {
  id: string;
  name: string | null;
  phone: string | null;
  vehicleInfo: string | null;
  currentLatitude: number | null;
  currentLongitude: number | null;
  locationUpdatedAt: Date | null;
  activeOrderCount: number;
}

export interface DeliveryCollectionItem {
  id: string;
  orderId: string;
  orderNumber: string;
  partnerId: string;
  partnerName: string | null;
  expectedAmount: number;
  cashCollected: number;
  upiCollected: number;
  walletApplied: number;
  adjustmentAmount: number;
  status: CollectionStatus;
  createdAt: Date;
}

export interface CollectionListResult {
  items: DeliveryCollectionItem[];
  total: number;
  page: number;
  pageSize: number;
}

export interface DeliverySlabItem {
  id: string;
  minKm: number;
  maxKm: number;
  fee: number;
  isActive: boolean;
}

class DeliveryServiceError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 400
  ) {
    super(message);
    this.name = 'DeliveryServiceError';
  }
}

// --- Service ---

export class DeliveryService {
  /**
   * List all active delivery partners with their current location and active order count.
   */
  static async getActivePartners(): Promise<ActivePartner[]> {
    try {
      const partners = await prisma.user.findMany({
        where: { role: 'DELIVERY_PARTNER', isActive: true },
        select: {
          id: true,
          name: true,
          phone: true,
          vehicleInfo: true,
          currentLatitude: true,
          currentLongitude: true,
          locationUpdatedAt: true,
          _count: {
            select: {
              assignedOrders: {
                where: {
                  status: { in: ['OUT_FOR_DELIVERY', 'ARRIVING'] },
                },
              },
            },
          },
        },
        orderBy: { name: 'asc' },
      });

      return partners.map((p) => ({
        id: p.id,
        name: p.name,
        phone: p.phone,
        vehicleInfo: p.vehicleInfo,
        currentLatitude: p.currentLatitude ? Number(p.currentLatitude) : null,
        currentLongitude: p.currentLongitude ? Number(p.currentLongitude) : null,
        locationUpdatedAt: p.locationUpdatedAt,
        activeOrderCount: p._count.assignedOrders,
      }));
    } catch (err) {
      throw new DeliveryServiceError(
        `Failed to fetch active partners: ${err instanceof Error ? err.message : 'Unknown error'}`,
        'PARTNERS_FETCH_FAILED',
        500
      );
    }
  }

  /**
   * Get paginated delivery collections with optional filters.
   */
  static async getCollections(params: {
    partnerId?: string;
    status?: CollectionStatus;
    page?: number;
    pageSize?: number;
  }): Promise<CollectionListResult> {
    const { partnerId, status, page = 1, pageSize = 20 } = params;
    const skip = (page - 1) * pageSize;

    const where: Record<string, unknown> = {};
    if (partnerId) where.partnerId = partnerId;
    if (status) where.status = status;

    try {
      const [items, total] = await Promise.all([
        prisma.deliveryCollection.findMany({
          where,
          include: {
            order: { select: { orderNumber: true } },
            partner: { select: { name: true } },
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: pageSize,
        }),
        prisma.deliveryCollection.count({ where }),
      ]);

      return {
        items: items.map((c) => ({
          id: c.id,
          orderId: c.orderId,
          orderNumber: c.order.orderNumber,
          partnerId: c.partnerId,
          partnerName: c.partner.name,
          expectedAmount: Number(c.expectedAmount),
          cashCollected: Number(c.cashCollected),
          upiCollected: Number(c.upiCollected),
          walletApplied: Number(c.walletApplied),
          adjustmentAmount: Number(c.adjustmentAmount),
          status: c.status,
          createdAt: c.createdAt,
        })),
        total,
        page,
        pageSize,
      };
    } catch (err) {
      throw new DeliveryServiceError(
        `Failed to fetch collections: ${err instanceof Error ? err.message : 'Unknown error'}`,
        'COLLECTIONS_FETCH_FAILED',
        500
      );
    }
  }

  /**
   * Get all active delivery fee slabs, ordered by distance.
   */
  static async getSlabs(): Promise<DeliverySlabItem[]> {
    try {
      const slabs = await prisma.deliveryFeeSlab.findMany({
        where: { isActive: true },
        orderBy: { minKm: 'asc' },
      });

      return slabs.map((s) => ({
        id: s.id,
        minKm: Number(s.minKm),
        maxKm: Number(s.maxKm),
        fee: Number(s.fee),
        isActive: s.isActive,
      }));
    } catch (err) {
      throw new DeliveryServiceError(
        `Failed to fetch delivery slabs: ${err instanceof Error ? err.message : 'Unknown error'}`,
        'SLABS_FETCH_FAILED',
        500
      );
    }
  }
}
