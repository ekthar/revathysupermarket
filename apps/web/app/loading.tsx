import { HomePageSkeleton } from "@/components/ui/streaming-skeleton";

/**
 * Home page loading skeleton.
 * Renders layout structure instantly while server data streams in.
 * Prioritizes above-the-fold content (search, hero, categories).
 * Uses CSS-only shimmer animations (no JS overhead).
 */
export default function HomeLoading() {
  return <HomePageSkeleton />;
}
