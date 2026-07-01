import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { ArrowLeft } from "lucide-react";
import { SettingsClient } from "@/components/account/settings-client";

export const dynamic = "force-dynamic";

export default async function AccountSettingsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login?callbackUrl=/account/settings");

  let settings = await prisma.userSettings.findUnique({
    where: { userId: session.user.id }
  });

  // Create defaults if none exist
  if (!settings) {
    settings = await prisma.userSettings.create({
      data: { userId: session.user.id }
    });
  }

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
          <h1 className="text-title font-bold text-neutral-900 dark:text-white">Settings</h1>
          <p className="text-caption text-neutral-500 dark:text-neutral-400">Manage your preferences</p>
        </div>
      </div>

      <SettingsClient
        settings={{
          pushNotifications: settings.pushNotifications,
          orderUpdates: settings.orderUpdates,
          promotionalMessages: settings.promotionalMessages,
          whatsappNotifications: settings.whatsappNotifications,
          priceDropAlerts: settings.priceDropAlerts,
          weeklyDeals: settings.weeklyDeals,
          deliveryAlerts: settings.deliveryAlerts
        }}
      />
    </main>
  );
}
