import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth-guard";
import { DeliveryPricingClient } from "@/components/admin/delivery-pricing-client";

export default async function DeliveryPricingPage() {
  const permission = await requirePermission("pricing.manage");
  if ("error" in permission) redirect("/admin");
  const slabs = await prisma.deliveryFeeSlab.findMany({ where: { isActive: true }, orderBy: { minKm: "asc" } });
  return <DeliveryPricingClient initialSlabs={slabs.map((slab) => ({ id: slab.id, minKm: Number(slab.minKm), maxKm: Number(slab.maxKm), fee: Number(slab.fee) }))} />;
}
