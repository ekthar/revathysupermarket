import { prisma } from '@/lib/prisma';

// --- Types ---

export interface SalesReport {
  totalRevenue: number;
  orderCount: number;
  avgOrderValue: number;
  dateFrom: Date;
  dateTo: Date;
}

export interface CancelledOrderItem {
  id: string;
  orderNumber: string;
  customerName: string;
  total: number;
  cancelledAt: Date;
  reason: string | null;
}

export interface CancelledReport {
  orders: CancelledOrderItem[];
  totalCount: number;
  totalLostRevenue: number;
  dateFrom: Date;
  dateTo: Date;
}

export interface StaffActivityItem {
  staffId: string;
  staffName: string | null;
  ordersAcknowledged: number;
}

export interface StaffActivityReport {
  staff: StaffActivityItem[];
  dateFrom: Date;
  dateTo: Date;
}

class ReportServiceError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 400
  ) {
    super(message);
    this.name = 'ReportServiceError';
  }
}

// --- Service ---

export class ReportService {
  /**
   * Revenue, order count, and average order value for a date range.
   * Includes only DELIVERED orders.
   */
  static async getSalesReport(dateFrom: Date, dateTo: Date): Promise<SalesReport> {
    try {
      const result = await prisma.order.aggregate({
        where: {
          status: 'DELIVERED',
          createdAt: { gte: dateFrom, lte: dateTo },
        },
        _sum: { total: true },
        _count: { id: true },
        _avg: { total: true },
      });

      return {
        totalRevenue: Number(result._sum.total ?? 0),
        orderCount: result._count.id,
        avgOrderValue: Number(result._avg.total ?? 0),
        dateFrom,
        dateTo,
      };
    } catch (err) {
      throw new ReportServiceError(
        `Failed to generate sales report: ${err instanceof Error ? err.message : 'Unknown error'}`,
        'SALES_REPORT_FAILED',
        500
      );
    }
  }

  /**
   * Cancelled orders within a date range with cancellation reasons.
   * Reason is extracted from the last CANCELLED status event note.
   */
  static async getCancelledReport(dateFrom: Date, dateTo: Date): Promise<CancelledReport> {
    try {
      const orders = await prisma.order.findMany({
        where: {
          status: 'CANCELLED',
          createdAt: { gte: dateFrom, lte: dateTo },
        },
        select: {
          id: true,
          orderNumber: true,
          customerName: true,
          total: true,
          createdAt: true,
          statusEvents: {
            where: { status: 'CANCELLED' },
            orderBy: { createdAt: 'desc' },
            take: 1,
            select: { note: true, createdAt: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      const items: CancelledOrderItem[] = orders.map((o) => ({
        id: o.id,
        orderNumber: o.orderNumber,
        customerName: o.customerName,
        total: Number(o.total),
        cancelledAt: o.statusEvents[0]?.createdAt ?? o.createdAt,
        reason: o.statusEvents[0]?.note ?? null,
      }));

      const totalLostRevenue = items.reduce((sum, o) => sum + o.total, 0);

      return {
        orders: items,
        totalCount: items.length,
        totalLostRevenue,
        dateFrom,
        dateTo,
      };
    } catch (err) {
      throw new ReportServiceError(
        `Failed to generate cancelled report: ${err instanceof Error ? err.message : 'Unknown error'}`,
        'CANCELLED_REPORT_FAILED',
        500
      );
    }
  }

  /**
   * Count of orders acknowledged by each staff member in a date range.
   */
  static async getStaffActivity(dateFrom: Date, dateTo: Date): Promise<StaffActivityReport> {
    try {
      const staffOrders = await prisma.order.groupBy({
        by: ['acknowledgedById'],
        where: {
          acknowledgedById: { not: null },
          acknowledgedAt: { gte: dateFrom, lte: dateTo },
        },
        _count: { id: true },
      });

      // Fetch staff names for the IDs
      const staffIds = staffOrders
        .map((s) => s.acknowledgedById)
        .filter((id): id is string => id !== null);

      const staffUsers = await prisma.user.findMany({
        where: { id: { in: staffIds } },
        select: { id: true, name: true },
      });

      const nameMap = new Map(staffUsers.map((u) => [u.id, u.name]));

      const staff: StaffActivityItem[] = staffOrders
        .filter((s) => s.acknowledgedById !== null)
        .map((s) => ({
          staffId: s.acknowledgedById!,
          staffName: nameMap.get(s.acknowledgedById!) ?? null,
          ordersAcknowledged: s._count.id,
        }))
        .sort((a, b) => b.ordersAcknowledged - a.ordersAcknowledged);

      return { staff, dateFrom, dateTo };
    } catch (err) {
      throw new ReportServiceError(
        `Failed to generate staff activity report: ${err instanceof Error ? err.message : 'Unknown error'}`,
        'STAFF_ACTIVITY_FAILED',
        500
      );
    }
  }
}
