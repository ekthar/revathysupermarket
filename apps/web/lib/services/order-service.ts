import { prisma } from '@/lib/prisma';
import { OrderStatus, Prisma } from '@prisma/client';

// --- Types ---

export interface OrderListParams {
  page?: number;
  pageSize?: number;
  status?: string;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface OrderListResult {
  orders: OrderListItem[];
  total: number;
  page: number;
  pageSize: number;
}

export interface OrderListItem {
  id: string;
  orderNumber: string;
  customerName: string;
  phone: string;
  status: OrderStatus;
  total: Prisma.Decimal;
  paymentMethod: string;
  paymentStatus: string;
  itemCount: number;
  createdAt: Date;
  acknowledgedAt: Date | null;
  deliveryPartner: { id: string; name: string | null } | null;
}

export interface OrderStats {
  todayOrders: number;
  pendingOrders: number;
  revenue: number;
  avgOrderValue: number;
  deliveredToday: number;
  cancelledToday: number;
}

export class ServiceError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 400
  ) {
    super(message);
    this.name = 'ServiceError';
  }
}

// Valid status transitions map
const VALID_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  ORDER_RECEIVED: [OrderStatus.ACCEPTED, OrderStatus.CANCELLED, OrderStatus.AWAITING_CUSTOMER_APPROVAL],
  AWAITING_CUSTOMER_APPROVAL: [OrderStatus.ACCEPTED, OrderStatus.CANCELLED],
  ACCEPTED: [OrderStatus.PACKING, OrderStatus.CANCELLED],
  PACKING: [OrderStatus.READY_FOR_DELIVERY, OrderStatus.CANCELLED],
  READY_FOR_DELIVERY: [OrderStatus.OUT_FOR_DELIVERY, OrderStatus.CANCELLED],
  OUT_FOR_DELIVERY: [OrderStatus.ARRIVING, OrderStatus.DELIVERED, OrderStatus.CUSTOMER_UNAVAILABLE, OrderStatus.CANCELLED],
  ARRIVING: [OrderStatus.DELIVERED, OrderStatus.CUSTOMER_UNAVAILABLE],
  CUSTOMER_UNAVAILABLE: [OrderStatus.RETURNED_TO_STORE, OrderStatus.DELIVERED],
  RETURNED_TO_STORE: [],
  DELIVERED: [],
  CANCELLED: [],
};

// --- Service ---

export class OrderService {
  static async list(params: OrderListParams): Promise<OrderListResult> {
    const page = Math.max(1, params.page ?? 1);
    const pageSize = Math.min(100, Math.max(1, params.pageSize ?? 20));
    const skip = (page - 1) * pageSize;

    const where: Prisma.OrderWhereInput = {};

    if (params.status && Object.values(OrderStatus).includes(params.status as OrderStatus)) {
      where.status = params.status as OrderStatus;
    }

    if (params.search) {
      const search = params.search.trim();
      where.OR = [
        { orderNumber: { contains: search, mode: 'insensitive' } },
        { customerName: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (params.dateFrom || params.dateTo) {
      where.createdAt = {};
      if (params.dateFrom) {
        where.createdAt.gte = new Date(params.dateFrom);
      }
      if (params.dateTo) {
        where.createdAt.lte = new Date(params.dateTo);
      }
    }

    try {
      const [orders, total] = await Promise.all([
        prisma.order.findMany({
          where,
          skip,
          take: pageSize,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            orderNumber: true,
            customerName: true,
            phone: true,
            status: true,
            total: true,
            paymentMethod: true,
            paymentStatus: true,
            createdAt: true,
            acknowledgedAt: true,
            deliveryPartner: {
              select: { id: true, name: true },
            },
            _count: {
              select: { items: true },
            },
          },
        }),
        prisma.order.count({ where }),
      ]);

      const mapped: OrderListItem[] = orders.map((o) => ({
        id: o.id,
        orderNumber: o.orderNumber,
        customerName: o.customerName,
        phone: o.phone,
        status: o.status,
        total: o.total,
        paymentMethod: o.paymentMethod,
        paymentStatus: o.paymentStatus,
        itemCount: o._count.items,
        createdAt: o.createdAt,
        acknowledgedAt: o.acknowledgedAt,
        deliveryPartner: o.deliveryPartner,
      }));

      return { orders: mapped, total, page, pageSize };
    } catch (err) {
      throw new ServiceError(
        `Failed to list orders: ${err instanceof Error ? err.message : 'Unknown error'}`,
        'ORDER_LIST_FAILED',
        500
      );
    }
  }

  static async getById(id: string) {
    try {
      const order = await prisma.order.findUnique({
        where: { id },
        include: {
          items: {
            include: {
              product: { select: { id: true, name: true, image: true, slug: true } },
            },
          },
          statusEvents: { orderBy: { createdAt: 'asc' } },
          deliveryPartner: { select: { id: true, name: true, phone: true, image: true } },
          user: { select: { id: true, name: true, email: true, phone: true } },
          acknowledgedBy: { select: { id: true, name: true } },
          feedback: true,
          deliveryCollection: true,
        },
      });

      if (!order) {
        throw new ServiceError('Order not found', 'ORDER_NOT_FOUND', 404);
      }

      return order;
    } catch (err) {
      if (err instanceof ServiceError) throw err;
      throw new ServiceError(
        `Failed to fetch order: ${err instanceof Error ? err.message : 'Unknown error'}`,
        'ORDER_FETCH_FAILED',
        500
      );
    }
  }

  static async updateStatus(id: string, status: string, actorId: string) {
    if (!Object.values(OrderStatus).includes(status as OrderStatus)) {
      throw new ServiceError(`Invalid order status: ${status}`, 'INVALID_STATUS', 400);
    }

    const newStatus = status as OrderStatus;

    try {
      const order = await prisma.order.findUnique({
        where: { id },
        select: { id: true, status: true, orderNumber: true },
      });

      if (!order) {
        throw new ServiceError('Order not found', 'ORDER_NOT_FOUND', 404);
      }

      const allowed = VALID_TRANSITIONS[order.status];
      if (!allowed.includes(newStatus)) {
        throw new ServiceError(
          `Cannot transition from ${order.status} to ${newStatus}`,
          'INVALID_STATUS_TRANSITION',
          400
        );
      }

      const updated = await prisma.$transaction(async (tx) => {
        const updatedOrder = await tx.order.update({
          where: { id },
          data: { status: newStatus },
        });

        await tx.orderEvent.create({
          data: {
            orderId: id,
            status: newStatus,
            note: `Status updated by ${actorId}`,
          },
        });

        return updatedOrder;
      });

      return updated;
    } catch (err) {
      if (err instanceof ServiceError) throw err;
      throw new ServiceError(
        `Failed to update order status: ${err instanceof Error ? err.message : 'Unknown error'}`,
        'ORDER_STATUS_UPDATE_FAILED',
        500
      );
    }
  }

  static async acknowledge(id: string, actorId: string) {
    try {
      const order = await prisma.order.findUnique({
        where: { id },
        select: { id: true, acknowledgedAt: true },
      });

      if (!order) {
        throw new ServiceError('Order not found', 'ORDER_NOT_FOUND', 404);
      }

      if (order.acknowledgedAt) {
        throw new ServiceError('Order already acknowledged', 'ORDER_ALREADY_ACKNOWLEDGED', 400);
      }

      const updated = await prisma.order.update({
        where: { id },
        data: {
          acknowledgedAt: new Date(),
          acknowledgedById: actorId,
        },
      });

      return updated;
    } catch (err) {
      if (err instanceof ServiceError) throw err;
      throw new ServiceError(
        `Failed to acknowledge order: ${err instanceof Error ? err.message : 'Unknown error'}`,
        'ORDER_ACKNOWLEDGE_FAILED',
        500
      );
    }
  }

  static async getStats(dateRange?: { from: Date; to: Date }): Promise<OrderStats> {
    try {
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);

      const revenueWhere: Prisma.OrderWhereInput = {
        status: OrderStatus.DELIVERED,
        createdAt: dateRange
          ? { gte: dateRange.from, lte: dateRange.to }
          : { gte: todayStart, lt: todayEnd },
      };

      const [todayOrders, pendingOrders, revenueAgg, deliveredToday, cancelledToday] =
        await Promise.all([
          prisma.order.count({
            where: { createdAt: { gte: todayStart, lt: todayEnd } },
          }),
          prisma.order.count({
            where: {
              status: {
                in: [
                  OrderStatus.ORDER_RECEIVED,
                  OrderStatus.ACCEPTED,
                  OrderStatus.PACKING,
                  OrderStatus.READY_FOR_DELIVERY,
                ],
              },
            },
          }),
          prisma.order.aggregate({
            where: revenueWhere,
            _sum: { total: true },
            _count: true,
          }),
          prisma.order.count({
            where: {
              status: OrderStatus.DELIVERED,
              createdAt: { gte: todayStart, lt: todayEnd },
            },
          }),
          prisma.order.count({
            where: {
              status: OrderStatus.CANCELLED,
              createdAt: { gte: todayStart, lt: todayEnd },
            },
          }),
        ]);

      const revenue = Number(revenueAgg._sum.total ?? 0);
      const orderCount = revenueAgg._count;

      return {
        todayOrders,
        pendingOrders,
        revenue,
        avgOrderValue: orderCount > 0 ? revenue / orderCount : 0,
        deliveredToday,
        cancelledToday,
      };
    } catch (err) {
      throw new ServiceError(
        `Failed to fetch order stats: ${err instanceof Error ? err.message : 'Unknown error'}`,
        'ORDER_STATS_FAILED',
        500
      );
    }
  }
}
