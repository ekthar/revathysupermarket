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
};

export type CartItem = Product & {
  quantity: number;
};
