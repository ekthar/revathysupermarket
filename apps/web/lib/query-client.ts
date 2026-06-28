import { QueryClient } from "@tanstack/react-query";

export function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Keep data fresh for 2 minutes (reduces refetches on navigation)
        staleTime: 2 * 60 * 1000,
        // Keep unused data in memory for 10 minutes (instant back-navigation)
        gcTime: 10 * 60 * 1000,
        // Don't refetch when window regains focus (prevents scroll position loss)
        refetchOnWindowFocus: false,
        // Retry once on failure (quick recovery without blocking UI)
        retry: 1,
        retryDelay: 1000,
      },
    },
  });
}

let browserQueryClient: QueryClient | undefined = undefined;

export function getQueryClient() {
  if (typeof window === "undefined") {
    return makeQueryClient();
  }
  if (!browserQueryClient) browserQueryClient = makeQueryClient();
  return browserQueryClient;
}
