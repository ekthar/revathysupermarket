"use client";

import { AdminErrorBoundary } from "@/components/admin/shared";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <AdminErrorBoundary error={error} reset={reset} context="loading push notifications" />;
}
