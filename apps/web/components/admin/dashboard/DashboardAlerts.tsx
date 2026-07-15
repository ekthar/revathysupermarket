"use client";

import Link from "next/link";
import Image from "next/image";
import { AlertTriangle, ArrowRight } from "lucide-react";

interface LowStockProduct {
  id: string;
  name: string;
  stock: number;
  image: string | null;
}

interface DashboardAlertsProps {
  products: LowStockProduct[];
  showValuation?: boolean;
}

export function DashboardAlerts({ products }: DashboardAlertsProps) {
  if (!products.length) {
    return (
      <div className="rounded-2xl border border-neutral-100 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-neutral-400" />
          <h3 className="text-sm font-semibold text-neutral-900 dark:text-white">Stock Alerts</h3>
        </div>
        <p className="mt-4 text-sm text-neutral-500 dark:text-neutral-400">All products well stocked</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-neutral-100 bg-white dark:border-neutral-800 dark:bg-neutral-900">
      <div className="flex items-center justify-between border-b border-neutral-100 px-5 py-4 dark:border-neutral-800">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-amber-500" />
          <h3 className="text-sm font-semibold text-neutral-900 dark:text-white">Low Stock</h3>
        </div>
        <Link
          href="/admin/products"
          className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 hover:text-emerald-700 dark:text-emerald-400"
        >
          Manage <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
        {products.map((product) => (
          <div key={product.id} className="flex items-center gap-3 px-5 py-3">
            <div className="h-9 w-9 flex-shrink-0 overflow-hidden rounded-lg bg-neutral-100 dark:bg-neutral-800">
              {product.image ? (
                <Image
                  src={product.image}
                  alt={product.name}
                  width={36}
                  height={36}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  <span className="text-xs text-neutral-400">?</span>
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-neutral-900 dark:text-white">
                {product.name}
              </p>
            </div>
            <span
              className={`text-xs font-bold ${
                product.stock === 0
                  ? "text-red-600 dark:text-red-400"
                  : "text-amber-600 dark:text-amber-400"
              }`}
            >
              {product.stock === 0 ? "Out" : `${product.stock} left`}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
