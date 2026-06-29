import { ProductDetailSkeleton } from "@/components/ui/streaming-skeleton";

/**
 * Product detail page loading skeleton.
 * Renders full page layout instantly while product data loads.
 * Prevents layout shift by matching exact dimensions of final content.
 */
export default function ProductDetailLoading() {
  return <ProductDetailSkeleton />;
}
