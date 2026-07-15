"use client";

import { AdminErrorBoundary } from "@/components/admin/shared";

export default function CustomersError(props: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <AdminErrorBoundary {...props} context="loading customers" />;
}
