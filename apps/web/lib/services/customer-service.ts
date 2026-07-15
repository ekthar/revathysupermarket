import { prisma } from '@/lib/prisma';
import { Prisma, Role } from '@prisma/client';

// --- Types ---

export interface CustomerListParams {
  page?: number;
  pageSize?: number;
  search?: string;
}

export interface CustomerListResult {
  customers: CustomerListItem[];
  total: number;
  page: number;
  pageSize: number;
}

export interface CustomerListItem {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  isActive: boolean;
  createdAt: Date;
  orderCount: number;
  totalSpent: number;
}

export interface CustomerDetail {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  image: string | null;
  isActive: boolean;
  createdAt: Date;
  addresses: CustomerAddress[];
  loyaltyAccount: { balance: number; lifetimeEarned: number } | null;
  recentOrders: CustomerOrder[];
  orderCount: number;
  totalSpent: number;
}

export interface CustomerAddress {
  id: string;
  label: string;
  customerName: string | null;
  phone: string | null;
  houseName: string;
  street: string;
  landmark: string;
  pincode: string;
  isDefault: boolean;
}

export interface CustomerOrder {
  id: string;
  orderNumber: string;
  status: string;
  total: Prisma.Decimal;
  itemCount: number;
  createdAt: Date;
}

export interface CustomerOrdersResult {
  orders: CustomerOrder[];
  total: number;
  page: number;
  pageSize: number;
}

class CustomerServiceError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 400
  ) {
    super(message);
    this.name = 'CustomerServiceError';
  }
}

// --- Service ---

export class CustomerService {
  static async list(params: CustomerListParams): Promise<CustomerListResult> {
    const page = Math.max(1, params.page ?? 1);
    const pageSize = Math.min(100, Math.max(1, params.pageSize ?? 20));
    const skip = (page - 1) * pageSize;

    const where: Prisma.UserWhereInput = {
      role: Role.CUSTOMER,
    };

    if (params.search) {
      const search = params.search.trim();
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
      ];
    }

    try {
      const [users, total] = await Promise.all([
        prisma.user.findMany({
          where,
          skip,
          take: pageSize,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            isActive: true,
            createdAt: true,
            _count: { select: { orders: true } },
            orders: {
              where: { status: 'DELIVERED' },
              select: { total: true },
            },
          },
        }),
        prisma.user.count({ where }),
      ]);

      const customers: CustomerListItem[] = users.map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        phone: u.phone,
        isActive: u.isActive,
        createdAt: u.createdAt,
        orderCount: u._count.orders,
        totalSpent: u.orders.reduce((sum, o) => sum + Number(o.total), 0),
      }));

      return { customers, total, page, pageSize };
    } catch (err) {
      throw new CustomerServiceError(
        `Failed to list customers: ${err instanceof Error ? err.message : 'Unknown error'}`,
        'CUSTOMER_LIST_FAILED',
        500
      );
    }
  }

  static async getById(id: string): Promise<CustomerDetail> {
    try {
      const user = await prisma.user.findUnique({
        where: { id },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          image: true,
          isActive: true,
          createdAt: true,
          role: true,
          addresses: {
            select: {
              id: true,
              label: true,
              customerName: true,
              phone: true,
              houseName: true,
              street: true,
              landmark: true,
              pincode: true,
              isDefault: true,
            },
            orderBy: { isDefault: 'desc' },
          },
          loyaltyAccount: {
            select: { balance: true, lifetimeEarned: true },
          },
          orders: {
            take: 10,
            orderBy: { createdAt: 'desc' },
            select: {
              id: true,
              orderNumber: true,
              status: true,
              total: true,
              createdAt: true,
              _count: { select: { items: true } },
            },
          },
          _count: { select: { orders: true } },
        },
      });

      if (!user) {
        throw new CustomerServiceError('Customer not found', 'CUSTOMER_NOT_FOUND', 404);
      }

      if (user.role !== Role.CUSTOMER) {
        throw new CustomerServiceError('User is not a customer', 'NOT_A_CUSTOMER', 400);
      }

      // Calculate total spent from delivered orders
      const spentAgg = await prisma.order.aggregate({
        where: { userId: id, status: 'DELIVERED' },
        _sum: { total: true },
      });

      const recentOrders: CustomerOrder[] = user.orders.map((o) => ({
        id: o.id,
        orderNumber: o.orderNumber,
        status: o.status,
        total: o.total,
        itemCount: o._count.items,
        createdAt: o.createdAt,
      }));

      return {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        image: user.image,
        isActive: user.isActive,
        createdAt: user.createdAt,
        addresses: user.addresses,
        loyaltyAccount: user.loyaltyAccount,
        recentOrders,
        orderCount: user._count.orders,
        totalSpent: Number(spentAgg._sum.total ?? 0),
      };
    } catch (err) {
      if (err instanceof CustomerServiceError) throw err;
      throw new CustomerServiceError(
        `Failed to fetch customer: ${err instanceof Error ? err.message : 'Unknown error'}`,
        'CUSTOMER_FETCH_FAILED',
        500
      );
    }
  }

  static async getOrders(
    userId: string,
    params: { page?: number; pageSize?: number }
  ): Promise<CustomerOrdersResult> {
    const page = Math.max(1, params.page ?? 1);
    const pageSize = Math.min(100, Math.max(1, params.pageSize ?? 20));
    const skip = (page - 1) * pageSize;

    try {
      // Verify user exists
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true },
      });

      if (!user) {
        throw new CustomerServiceError('Customer not found', 'CUSTOMER_NOT_FOUND', 404);
      }

      const where: Prisma.OrderWhereInput = { userId };

      const [orders, total] = await Promise.all([
        prisma.order.findMany({
          where,
          skip,
          take: pageSize,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            orderNumber: true,
            status: true,
            total: true,
            createdAt: true,
            _count: { select: { items: true } },
          },
        }),
        prisma.order.count({ where }),
      ]);

      const mapped: CustomerOrder[] = orders.map((o) => ({
        id: o.id,
        orderNumber: o.orderNumber,
        status: o.status,
        total: o.total,
        itemCount: o._count.items,
        createdAt: o.createdAt,
      }));

      return { orders: mapped, total, page, pageSize };
    } catch (err) {
      if (err instanceof CustomerServiceError) throw err;
      throw new CustomerServiceError(
        `Failed to fetch customer orders: ${err instanceof Error ? err.message : 'Unknown error'}`,
        'CUSTOMER_ORDERS_FAILED',
        500
      );
    }
  }
}
