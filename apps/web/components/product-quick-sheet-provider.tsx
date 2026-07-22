"use client";

import { createContext, useCallback, useContext, useState } from "react";
import { ProductQuickSheet } from "@/components/product-quick-sheet";
import type { Product } from "@/lib/types";

type QuickSheetContextValue = {
  openProduct: (product: Product) => void;
};

const QuickSheetContext = createContext<QuickSheetContextValue | null>(null);

/**
 * ProductQuickSheetProvider — mounts the sheet and provides context to open it.
 *
 * Place this in the app providers. Product cards call `openProduct(product)`
 * on mobile to show the quick sheet instead of navigating to the full page.
 */
export function ProductQuickSheetProvider({ children }: { children: React.ReactNode }) {
  const [product, setProduct] = useState<Product | null>(null);
  const [open, setOpen] = useState(false);

  const openProduct = useCallback((p: Product) => {
    setProduct(p);
    setOpen(true);
  }, []);

  const handleClose = useCallback(() => {
    setOpen(false);
    // Keep product in state briefly so exit animation shows content
    setTimeout(() => setProduct(null), 300);
  }, []);

  return (
    <QuickSheetContext.Provider value={{ openProduct }}>
      {children}
      <ProductQuickSheet product={product} open={open} onClose={handleClose} />
    </QuickSheetContext.Provider>
  );
}

/**
 * Hook to open the product quick sheet from any component.
 * Returns null if not inside the provider (graceful — card falls back to navigation).
 */
export function useProductQuickSheet() {
  return useContext(QuickSheetContext);
}
