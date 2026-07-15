import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { ArrowLeft } from "lucide-react";
import { AddressesPageClient } from "@/components/account/addresses-page-client";

export const dynamic = "force-dynamic";

export default async function AddressesPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login?callbackUrl=/account/addresses");

  const addresses = await prisma.address.findMany({
    where: { userId: session.user.id },
    orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
  }).catch(() => []);

  const serialized = addresses.map((a) => ({
    id: a.id,
    label: a.label || "Home",
    customerName: a.customerName || "",
    phone: a.phone || "",
    houseName: a.houseName,
    street: a.street,
    landmark: a.landmark,
    pincode: a.pincode,
    latitude: Number(a.latitude),
    longitude: Number(a.longitude),
    isDefault: a.isDefault,
  }));

  return (
    <main className="max-w-lg mx-auto px-4 py-5">
      <div className="flex items-center gap-3 mb-5">
        <Link href="/account" className="flex h-9 w-9 items-center justify-center rounded-full bg-card shadow press">
          <ArrowLeft className="h-4 w-4 text-neutral-600 dark:text-neutral-300" />
        </Link>
        <div>
          <h1 className="text-lg font-bold text-neutral-900 dark:text-white">My Addresses</h1>
          <p className="text-xs text-neutral-500">Manage your saved delivery addresses</p>
        </div>
      </div>
      <AddressesPageClient addresses={serialized} />
    </main>
  );
}
