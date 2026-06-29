/**
 * UI Component Library — Barrel exports
 * 
 * Import pattern: import { Button, Input, PriceTag } from "@/components/ui"
 */

export { Button, buttonVariants } from "./button";
export { Input } from "./input";
export { Skeleton, ProductCardSkeleton, CategoryCardSkeleton, CartItemSkeleton, ProductGridSkeleton } from "./skeleton-loader";
export { EmptyState } from "./empty-state";
export { ErrorBoundary, ErrorFallback } from "./error-boundary";
export { PriceTag } from "./price-tag";
export { QuantityStepper } from "./quantity-stepper";
export { CategoryChip } from "./category-chip";
export { OfflineBanner } from "./offline-banner";
export { TurnstileWidget } from "./turnstile-widget";
export { BottomSheet } from "./bottom-sheet";
export {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "./dialog";
