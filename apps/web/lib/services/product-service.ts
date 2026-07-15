import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

// --- Types ---

export interface ProductListParams {
  page?: number;
  pageSize?: number;
  categoryId?: string;
  search?: string;
  isActive?: boolean;
  sortBy?: 'name' | 'price' | 'stock' | 'popularity' | 'createdAt';
  sortDir?: 'asc' | 'desc';
}

export interface ProductListResult {
  products: ProductListItem[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ProductListItem {
  id: string;
  name: string;
  slug: string;
  image: string;
  price: Prisma.Decimal;
  discountPrice: Prisma.Decimal | null;
  stock: number;
  unit: string;
  isActive: boolean;
  isFeatured: boolean;
  popularity: number;
  category: { id: string; name: string };
  createdAt: Date;
}

export interface CreateProductData {
  name: string;
  slug: string;
  description: string;
  image: string;
  price: number;
  discountPrice?: number | null;
  costPrice?: number | null;
  brand?: string | null;
  stock: number;
  unit: string;
  isActive?: boolean;
  isFeatured?: boolean;
  gstRate?: number | null;
  categoryId: string;
  subCategoryId?: string | null;
}

export interface UpdateProductData {
  name?: string;
  slug?: string;
  description?: string;
  image?: string;
  price?: number;
  discountPrice?: number | null;
  costPrice?: number | null;
  brand?: string | null;
  stock?: number;
  unit?: string;
  isActive?: boolean;
  isFeatured?: boolean;
  gstRate?: number | null;
  categoryId?: string;
  subCategoryId?: string | null;
}

class ProductServiceError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 400
  ) {
    super(message);
    this.name = 'ProductServiceError';
  }
}

// --- Service ---

export class ProductService {
  static async list(params: ProductListParams): Promise<ProductListResult> {
    const page = Math.max(1, params.page ?? 1);
    const pageSize = Math.min(100, Math.max(1, params.pageSize ?? 20));
    const skip = (page - 1) * pageSize;

    const where: Prisma.ProductWhereInput = {};

    if (params.categoryId) {
      where.categoryId = params.categoryId;
    }

    if (typeof params.isActive === 'boolean') {
      where.isActive = params.isActive;
    }

    if (params.search) {
      const search = params.search.trim();
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { brand: { contains: search, mode: 'insensitive' } },
      ];
    }

    const sortBy = params.sortBy ?? 'createdAt';
    const sortDir = params.sortDir ?? 'desc';
    const orderBy: Prisma.ProductOrderByWithRelationInput = { [sortBy]: sortDir };

    try {
      const [products, total] = await Promise.all([
        prisma.product.findMany({
          where,
          skip,
          take: pageSize,
          orderBy,
          select: {
            id: true,
            name: true,
            slug: true,
            image: true,
            price: true,
            discountPrice: true,
            stock: true,
            unit: true,
            isActive: true,
            isFeatured: true,
            popularity: true,
            createdAt: true,
            category: { select: { id: true, name: true } },
          },
        }),
        prisma.product.count({ where }),
      ]);

      return { products, total, page, pageSize };
    } catch (err) {
      throw new ProductServiceError(
        `Failed to list products: ${err instanceof Error ? err.message : 'Unknown error'}`,
        'PRODUCT_LIST_FAILED',
        500
      );
    }
  }

  static async getById(id: string) {
    try {
      const product = await prisma.product.findUnique({
        where: { id },
        include: {
          category: { select: { id: true, name: true, slug: true } },
          subCategory: { select: { id: true, name: true, slug: true } },
        },
      });

      if (!product) {
        throw new ProductServiceError('Product not found', 'PRODUCT_NOT_FOUND', 404);
      }

      return product;
    } catch (err) {
      if (err instanceof ProductServiceError) throw err;
      throw new ProductServiceError(
        `Failed to fetch product: ${err instanceof Error ? err.message : 'Unknown error'}`,
        'PRODUCT_FETCH_FAILED',
        500
      );
    }
  }

  static async create(data: CreateProductData) {
    try {
      // Verify category exists
      const category = await prisma.category.findUnique({
        where: { id: data.categoryId },
        select: { id: true },
      });

      if (!category) {
        throw new ProductServiceError('Category not found', 'CATEGORY_NOT_FOUND', 400);
      }

      // Check slug uniqueness
      const existing = await prisma.product.findUnique({
        where: { slug: data.slug },
        select: { id: true },
      });

      if (existing) {
        throw new ProductServiceError('Product slug already exists', 'SLUG_EXISTS', 409);
      }

      const product = await prisma.product.create({
        data: {
          name: data.name,
          slug: data.slug,
          description: data.description,
          image: data.image,
          price: data.price,
          discountPrice: data.discountPrice ?? null,
          costPrice: data.costPrice ?? null,
          brand: data.brand ?? null,
          stock: data.stock,
          unit: data.unit,
          isActive: data.isActive ?? true,
          isFeatured: data.isFeatured ?? false,
          gstRate: data.gstRate ?? null,
          categoryId: data.categoryId,
          subCategoryId: data.subCategoryId ?? null,
        },
        include: {
          category: { select: { id: true, name: true } },
        },
      });

      return product;
    } catch (err) {
      if (err instanceof ProductServiceError) throw err;
      throw new ProductServiceError(
        `Failed to create product: ${err instanceof Error ? err.message : 'Unknown error'}`,
        'PRODUCT_CREATE_FAILED',
        500
      );
    }
  }

  static async update(id: string, data: UpdateProductData) {
    try {
      const existing = await prisma.product.findUnique({
        where: { id },
        select: { id: true },
      });

      if (!existing) {
        throw new ProductServiceError('Product not found', 'PRODUCT_NOT_FOUND', 404);
      }

      // If slug is being changed, check uniqueness
      if (data.slug) {
        const slugConflict = await prisma.product.findFirst({
          where: { slug: data.slug, id: { not: id } },
          select: { id: true },
        });

        if (slugConflict) {
          throw new ProductServiceError('Product slug already exists', 'SLUG_EXISTS', 409);
        }
      }

      // If categoryId is being changed, verify it exists
      if (data.categoryId) {
        const category = await prisma.category.findUnique({
          where: { id: data.categoryId },
          select: { id: true },
        });

        if (!category) {
          throw new ProductServiceError('Category not found', 'CATEGORY_NOT_FOUND', 400);
        }
      }

      const product = await prisma.product.update({
        where: { id },
        data,
        include: {
          category: { select: { id: true, name: true } },
        },
      });

      return product;
    } catch (err) {
      if (err instanceof ProductServiceError) throw err;
      throw new ProductServiceError(
        `Failed to update product: ${err instanceof Error ? err.message : 'Unknown error'}`,
        'PRODUCT_UPDATE_FAILED',
        500
      );
    }
  }

  static async toggleActive(id: string) {
    try {
      const product = await prisma.product.findUnique({
        where: { id },
        select: { id: true, isActive: true },
      });

      if (!product) {
        throw new ProductServiceError('Product not found', 'PRODUCT_NOT_FOUND', 404);
      }

      const updated = await prisma.product.update({
        where: { id },
        data: { isActive: !product.isActive },
        select: { id: true, name: true, isActive: true },
      });

      return updated;
    } catch (err) {
      if (err instanceof ProductServiceError) throw err;
      throw new ProductServiceError(
        `Failed to toggle product status: ${err instanceof Error ? err.message : 'Unknown error'}`,
        'PRODUCT_TOGGLE_FAILED',
        500
      );
    }
  }

  static async bulkUpdateStatus(ids: string[], isActive: boolean) {
    if (!ids.length) {
      throw new ProductServiceError('No product IDs provided', 'NO_IDS_PROVIDED', 400);
    }

    try {
      const result = await prisma.product.updateMany({
        where: { id: { in: ids } },
        data: { isActive },
      });

      return { updated: result.count, isActive };
    } catch (err) {
      throw new ProductServiceError(
        `Failed to bulk update products: ${err instanceof Error ? err.message : 'Unknown error'}`,
        'PRODUCT_BULK_UPDATE_FAILED',
        500
      );
    }
  }
}
