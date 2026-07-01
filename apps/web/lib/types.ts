export type Category =
  | "Fruits"
  | "Vegetables"
  | "Dairy"
  | "Beverages"
  | "Snacks"
  | "Household"
  | "Personal Care"
  | "Frozen Foods"
  | "Grocery Essentials";

export type SubCategory = {
  id: string;
  name: string;
  slug: string;
  categoryId: string;
  sortOrder: number;
};

export type Review = {
  id: string;
  userId: string;
  productId: string;
  rating: number;
  comment?: string;
  createdAt: string;
};

export type Product = {
  id: string;
  slug: string;
  name: string;
  category: Category;
  price: number;
  discountPrice?: number;
  image: string;
  description: string;
  stock: number;
  popularity: number;
  unit: string;
  isFeatured?: boolean;
  createdAt?: string;
  subcategory?: SubCategory;
  avgRating?: number;
  reviewCount?: number;
};

export type CartItem = Product & {
  quantity: number;
};
