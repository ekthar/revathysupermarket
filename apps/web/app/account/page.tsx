import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { auth, signOut } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getPublicStoreSettings } from "@/lib/store-settings";
import { ChevronRight, Gift, Heart, HelpCircle, LogOut, MapPin, Package, Pencil, Settings, User, Wallet } from "lucide-react";
import { InstallAppButton } from "@/components/install-app-button";
import { StoreInfoLinks } from "@/components/ui/store-info-links";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login?callbackUrl=/account");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { name: true, email: true, phone: true, image: true }
  });

  const [orderCount, addressCount, favoriteCount, walletBalance] = await Promise.all([
    prisma.order.count({ where: { userId: session.user.id } }).catch(() => 0),
    prisma.address.count({ where: { userId: session.user.id } }).catch(() => 0),
    prisma.favorite.count({ where: { userId: session.user.id } }).catch(() => 0),
    Promise.all([
      prisma.walletTransaction.aggregate({ _sum: { amount: true }, where: { userId: session.user.id, type: "credit" } }),
      prisma.walletTransaction.aggregate({ _sum: { amount: true }, where: { userId: session.user.id, type: "debit" } })
    ]).then(([c, d]) => Number(c._sum.amount ?? 0) - Number(d._sum.amount ?? 0)).catch(() => 0)
  ]);

  const storeSettings = await getPublicStoreSettings();
  const formatWallet = (v: number) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(v);

  return (
    <main className="mx-auto min-h-[100dvh] max-w-lg space-y-4 bg-background px-4 pb-28 pt-6">
      {/* Profile card */}
      <div className="relative overflow-hidden rounded-2xl bg-neutral-900 dark:bg-neutral-800 p-5 text-white">
        <div className="flex items-center gap-3.5">
          <div className="relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white/15 ring-1 ring-white/20">
            {user?.image ? (
              <Image src={user.image} alt="Profile" fill sizes="56px" className="object-cover" />
            ) : (
              <span className="text-xl font-black text-white">{user?.name?.charAt(0)?.toUpperCase() || "U"}</span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-lg font-bold leading-tight text-white truncate">{user?.name || "Customer"}</p>
            <p className="text-caption text-white/60 truncate">{user?.email || user?.phone || "No contact info"}</p>
          </div>
          <Link href="/account/edit" className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors text-white press" aria-label="Edit profile">
            <Pencil className="h-3.5 w-3.5" />
          </Link>
        </div>

        {/* Stats row */}
        <div className="mt-4 grid grid-cols-3 gap-2">
          <Stat value={orderCount} label="Orders" />
          <Stat value={formatWallet(walletBalance)} label="Wallet" />
          <Stat value={favoriteCount} label="Favorites" />
        </div>
      </div>

      {/* Activity */}
      <div className="overflow-hidden rounded-2xl bg-white dark:bg-neutral-900 shadow-elevation-1">
        <SectionLabel>Activity</SectionLabel>
        <AccountRow href="/dashboard" icon={Package} label="My Orders" detail={`${orderCount}`} />
        <AccountRow href="/account/addresses" icon={MapPin} label="Addresses" detail={`${addressCount}`} />
        <AccountRow href="/account/favorites" icon={Heart} label="Favorites" detail={`${favoriteCount}`} iconColor="text-red-400" />
        <AccountRow href="/account/wallet" icon={Wallet} label="Wallet" detail={walletBalance > 0 ? formatWallet(walletBalance) : "—"} iconColor="text-secondary-500" />
        <AccountRow href="/account/loyalty" icon={Gift} label="Rewards" detail="Points & referrals" iconColor="text-amber-500" />
      </div>

      {/* Settings */}
      <div className="overflow-hidden rounded-2xl bg-white dark:bg-neutral-900 shadow-elevation-1">
        <SectionLabel>Settings</SectionLabel>
        <AccountRow href="/account/settings" icon={Settings} label="Preferences" detail="Theme, notifications, payments" />
        <AccountRow href="/support" icon={HelpCircle} label="Help & Support" detail="" />
      </div>

      {/* Install app */}
      <InstallAppButton />

      {/* Store Links */}
      {(storeSettings.googleMapsUrl || storeSettings.instagramUrl || storeSettings.facebookUrl) && (
        <div className="overflow-hidden rounded-2xl bg-white dark:bg-neutral-900 shadow-elevation-1 p-4">
          <StoreInfoLinks
            googleMapsUrl={storeSettings.googleMapsUrl}
            instagramUrl={storeSettings.instagramUrl}
            facebookUrl={storeSettings.facebookUrl}
          />
        </div>
      )}

      {/* Logout */}
      <form action={async () => { "use server"; await signOut({ redirectTo: "/" }); }}>
        <button
          type="submit"
          className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl text-sm font-semibold text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors press"
        >
          <LogOut className="h-4 w-4" />
          Log out
        </button>
      </form>
    </main>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="px-4 pt-4 pb-1 text-[11px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-widest">
      {children}
    </p>
  );
}

function Stat({ value, label }: { value: string | number; label: string }) {
  return (
    <div className="rounded-xl bg-white/10 px-2 py-2.5 text-center">
      <p className="text-sm font-bold leading-none tabular-nums">{value}</p>
      <p className="mt-1 text-[10px] font-semibold uppercase tracking-wide text-white/60">{label}</p>
    </div>
  );
}

function AccountRow({ href, icon: Icon, label, detail, iconColor }: { href: string; icon: React.ElementType; label: string; detail: string; iconColor?: string }) {
  return (
    <Link href={href} className="flex items-center gap-3 px-4 py-3 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors press">
      <div className="h-8 w-8 rounded-lg bg-neutral-50 dark:bg-neutral-800 flex items-center justify-center shrink-0">
        <Icon className={`h-4 w-4 ${iconColor || "text-neutral-500 dark:text-neutral-400"}`} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-neutral-800 dark:text-white">{label}</p>
      </div>
      {detail && <span className="text-xs text-neutral-500 dark:text-neutral-400 shrink-0 tabular-nums">{detail}</span>}
      <ChevronRight className="h-4 w-4 text-neutral-300 dark:text-neutral-600 shrink-0" />
    </Link>
  );
}
