import Image from "next/image";
import { Minus, Package, Plus, Search } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { products as fallbackProducts } from "@/lib/products";
import { formatCurrency } from "@/lib/utils";
import { ProductManagementForm } from "@/components/admin/product-management-form";
import { safeProductImageUrl } from "@/lib/image";

export const dynamic = "force-dynamic";

export default async function AdminProductsPage() {
  const dbProducts = await prisma.product.findMany({
    include: { category: true },
    orderBy: { createdAt: "desc" }
  }).catch(() => []);
  const products = dbProducts.length > 0
    ? dbProducts.map((product) => ({
        id: product.id,
        name: product.name,
        category: product.category.name,
        price: Number(product.price),
        discountPrice: product.discountPrice ? Number(product.discountPrice) : undefined,
        stock: product.stock,
        image: product.image
      }))
    : fallbackProducts;
  const lowStock = products.filter((product) => product.stock <= 15);

  return (
    <div>
      <div className="rounded-[2rem] bg-[linear-gradient(135deg,rgba(15,138,95,0.12),rgba(167,209,41,0.16))] p-5 sm:p-7">
        <p className="text-xs font-black uppercase text-primary">Inventory</p>
        <h2 className="mt-2 font-display text-4xl font-black leading-tight">Products</h2>
        <p className="mt-2 text-sm text-muted-foreground">Add items, scan stock, and spot low-stock products quickly.</p>
        <label className="relative mt-5 block">
          <Search className="pointer-events-none absolute left-4 top-3.5 h-4 w-4 text-primary" />
          <input className="h-12 w-full rounded-2xl border border-white/70 bg-white/90 pl-11 pr-4 text-sm font-semibold outline-none focus:ring-2 focus:ring-primary dark:border-white/10 dark:bg-slate-900" placeholder="Search products or categories" />
        </label>
      </div>
      <ProductManagementForm />
      <section className="mt-5 rounded-[1.75rem] border border-white/70 bg-card/95 p-4 shadow-soft dark:border-white/10">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-red-50 text-red-600">
            <Package className="h-5 w-5" />
          </span>
          <div>
            <h3 className="font-display text-2xl font-black">Low stock</h3>
            <p className="text-sm text-muted-foreground">{lowStock.length} products need attention</p>
          </div>
        </div>
        <div className="no-scrollbar mt-4 flex gap-3 overflow-x-auto pb-1">
          {lowStock.slice(0, 10).map((product) => (
            <div key={product.id} className="min-w-40 rounded-2xl bg-red-50 p-3 text-red-700">
              <p className="line-clamp-2 text-sm font-black">{product.name}</p>
              <p className="mt-2 text-2xl font-black">{product.stock}</p>
            </div>
          ))}
        </div>
      </section>
      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {products.map((product) => (
          <article key={product.id} className="grid grid-cols-[84px_1fr] gap-3 rounded-[1.5rem] border border-white/70 bg-card/95 p-3 shadow-soft dark:border-white/10">
            <div className="relative aspect-square overflow-hidden rounded-[1.15rem] bg-muted">
              <Image src={safeProductImageUrl(product.image)} alt={product.name} fill className="object-cover" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-[10px] font-black uppercase text-primary">{product.category}</p>
              <h3 className="line-clamp-2 font-black leading-5">{product.name}</h3>
              <p className="mt-1 text-sm font-bold">{formatCurrency(product.discountPrice ?? product.price)}</p>
              <div className="mt-3 flex items-center justify-between gap-2">
                <div>
                  <p className="text-[10px] font-black uppercase text-muted-foreground">Stock</p>
                  <p className={product.stock <= 15 ? "text-xl font-black text-red-600" : "text-xl font-black text-primary"}>{product.stock}</p>
                </div>
                <div className="flex rounded-2xl border border-border bg-background/70">
                  <button className="flex h-10 w-10 items-center justify-center" type="button" title="Reduce stock">
                    <Minus className="h-4 w-4" />
                  </button>
                  <button className="flex h-10 w-10 items-center justify-center" type="button" title="Increase stock">
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
