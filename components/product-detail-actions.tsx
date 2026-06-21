"use client";

import { useState } from "react";
import { Minus, Plus, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/components/cart/cart-provider";
import type { Product } from "@/lib/types";

export function ProductDetailActions({ product }: { product: Product }) {
  const [quantity, setQuantity] = useState(1);
  const { addItem } = useCart();

  return (
    <div className="mt-8 flex flex-wrap items-center gap-4 pb-20 sm:pb-0">
      <div className="flex h-12 items-center rounded-xl border border-border">
        <Button variant="ghost" size="icon" onClick={() => setQuantity(Math.max(1, quantity - 1))} title="Decrease quantity">
          <Minus className="h-4 w-4" />
        </Button>
        <span className="w-10 text-center font-black">{quantity}</span>
        <Button variant="ghost" size="icon" onClick={() => setQuantity(quantity + 1)} title="Increase quantity">
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      <Button size="lg" disabled={product.stock <= 0} onClick={() => addItem(product, quantity)} className="ios-floating-action mx-auto max-w-md sm:static sm:mx-0">
        <ShoppingCart className="h-5 w-5" />
        Add to cart
      </Button>
    </div>
  );
}
