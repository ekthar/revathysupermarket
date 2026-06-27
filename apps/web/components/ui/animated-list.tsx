"use client";

import { useAutoAnimate } from "@auto-animate/react";
import { cn } from "@/lib/utils";

/**
 * AnimatedList — wraps a container so that list additions, removals,
 * and reorders animate smoothly instead of popping abruptly.
 *
 * Usage:
 * ```tsx
 * <AnimatedList className="space-y-3">
 *   {cartItems.map(item => <CartItem key={item.id} {...item} />)}
 * </AnimatedList>
 * ```
 *
 * Works for: cart items, favorites, search results, admin tables.
 */
export function AnimatedList({
  children,
  className,
  as: Component = "div",
  ...props
}: {
  children: React.ReactNode;
  className?: string;
  as?: React.ElementType;
} & React.HTMLAttributes<HTMLElement>) {
  const [parent] = useAutoAnimate({
    duration: 250,
    easing: "ease-out",
  });

  return (
    <Component ref={parent} className={cn(className)} {...props}>
      {children}
    </Component>
  );
}
