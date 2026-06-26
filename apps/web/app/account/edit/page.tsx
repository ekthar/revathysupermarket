import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { ArrowLeft } from "lucide-react";
import { ProfileEditClient } from "@/components/account/profile-edit-client";
import { SavedAddressesClient } from "@/components/account/saved-addresses-client";

export const dynamic = "force-dynamic";

export default async function ProfileEditPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login?callbackUrl=/account/edit");

  const [user, addresses] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: { name: true, email: true, phone: true, image: true }
    }),
    prisma.address.findMany({
      where: { userId: session.user.id },
      orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
      select: { id: true, label: true, houseName: true, street: true, landmark: true, pincode: true, isDefault: true }
    }).catch(() => [])
  ]);

  return (
    <main className="max-w-lg mx-auto px-4 py-5">
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <Link
          href="/account"
          className="flex h-9 w-9 items-center justify-center rounded-full bg-white dark:bg-neutral-800 card-shadow press"
        >
          <ArrowLeft className="h-4 w-4 text-neutral-600 dark:text-neutral-300" />
        </Link>
        <div>
          <h1 className="text-title font-bold text-neutral-900 dark:text-white">Edit Profile</h1>
          <p className="text-caption text-neutral-500 dark:text-neutral-400">Update your personal details & addresses</p>
        </div>
      </div>

      <ProfileEditClient
        user={{
          name: user?.name || "",
          email: user?.email || "",
          phone: user?.phone || "",
          image: user?.image || null
        }}
      />

      {/* Saved Addresses Section */}
      <SavedAddressesClient addresses={addresses} />
    </main>
  );
}
