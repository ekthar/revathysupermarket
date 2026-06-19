import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { ArrowLeft, Heart, ShoppingBag } from "lucide-react";
import { FavoritesClient } from "@/components/account/favorites-client";

export const dynamic = "force-dynamic";

export default async function FavoritesPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login?callbackUrl=/account/favorites");

  const favorites = await prisma.favorite.findMany({
    where: { userId: session.user.id },
    include: {
      product: {
        select: {
          id: true,
          name: true,
          slug: true,
          image: true,
          price: true,
          discountPrice: true,
          unit: true,
          stock: true,
          isActive: true,
          category: { select: { name: true, slug: true } }
        }
      }
    },
    orderBy: { createdAt: "desc" }
  });

  const products = favorites
    .filter((f) => f.product.isActive)
    .map((f) => ({
      id: f.product.id,
      name: f.product.name,
      slug: f.product.slug,
      image: f.product.image,
      price: Number(f.product.price),
      discountPrice: f.product.discountPrice ? Number(f.product.discountPrice) : undefined,
      unit: f.product.unit,
      stock: f.product.stock,
      category: f.product.category.name,
      addedAt: f.createdAt.toISOString()
    }));

  return (
    <main className="max-w-2xl mx-auto px-4 py-5">
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <Link
          href="/account"
          className="flex h-9 w-9 items-center justify-center rounded-full bg-white dark:bg-slate-800 card-shadow press"
        >
          <ArrowLeft className="h-4 w-4 text-slate-600 dark:text-slate-300" />
        </Link>
        <div>
          <h1 className="text-[18px] font-bold text-slate-900 dark:text-white">My Favorites</h1>
          <p className="text-[12px] text-slate-500 dark:text-slate-400">{products.length} items saved</p>
        </div>
      </div>

      {products.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="h-16 w-16 rounded-full bg-red-50 dark:bg-red-950/30 flex items-center justify-center mb-4">
            <Heart className="h-7 w-7 text-red-300 dark:text-red-400" />
          </div>
          <h2 className="text-[16px] font-bold text-slate-900 dark:text-white">No favorites yet</h2>
          <p className="text-[13px] text-slate-500 dark:text-slate-400 mt-1 max-w-xs">
            Tap the heart on any product to save it here for quick access
          </p>
          <Link
            href="/products"
            className="mt-5 flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary text-white text-[13px] font-semibold press"
          >
            <ShoppingBag className="h-4 w-4" />
            Browse Products
          </Link>
        </div>
      ) : (
        <FavoritesClient products={products} />
      )}
    </main>
  );
}
