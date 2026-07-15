import { AdminLoadingSkeleton } from "@/components/admin/shared";

export default function OrdersLoading() {
  return <AdminLoadingSkeleton variant="table" rows={10} />;
}
