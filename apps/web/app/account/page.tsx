import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { auth, signOut } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getPublicStoreSettings } from "@/lib/store-settings";
import { ChevronRight, CreditCard, Gift, Heart, HelpCircle, LogOut, MapPin, Package, Pencil, Phone, Settings, User, Wallet } from "lucide-react";
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

  return (
    <main className="mx-auto min-h-screen max-w-lg space-y-4 bg-background px-4 pb-28 pt-8">
      <div className="text-center">
        <p className="text-caption font-black uppercase tracking-[0.28em] text-neutral-400">Profile</p>
        <h1 className="font-display text-lg font-black tracking-tighter text-neutral-950 dark:text-white">Your account</h1>
      </div>

      {/* Profile card */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-secondary-500 via-secondary-600 to-teal-700 p-4 text-white shadow-premium">
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/12" />
        <div className="absolute right-4 top-12 h-24 w-24 rounded-full bg-white/10" />
        <div className="flex items-center gap-3">
          <div className="relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-white/20 ring-1 ring-white/35">
            {user?.image ? (
              <Image src={user.image} alt="Profile" fill sizes="56px" className="object-cover" />
            ) : (
              <User className="h-7 w-7 text-white" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-heading font-black leading-tight text-white truncate">{user?.name || "Customer"}</p>
            <p className="text-caption font-semibold text-white/80 truncate">{user?.email || user?.phone || "No contact info"}</p>
          </div>
          <Link href="/account/edit" className="flex h-9 w-9 items-center justify-center rounded-full bg-white/18 text-white press">
            <Pencil className="h-4 w-4" />
          </Link>
        </div>
        <div className="relative mt-4 grid grid-cols-3 gap-2">
          <Stat value={orderCount} label="Orders" />
          <Stat value={new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(walletBalance)} label="Wallet" />
          <Stat value={favoriteCount} label="Favorites" />
        </div>
      </div>

      {/* Wallet Balance Card */}
      <Link href="/account/wallet" className="block rounded-lg bg-white dark:bg-neutral-900 p-4 text-neutral-950 dark:text-white shadow-elevation-3 press">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary-50 dark:bg-secondary-900/30">
              <Wallet className="h-5 w-5 text-secondary-500" />
            </div>
            <div>
              <p className="text-caption font-bold text-neutral-400">Wallet Balance</p>
              <p className="text-heading font-bold tracking-tight dark:text-white">{new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(walletBalance)}</p>
            </div>
          </div>
          <ChevronRight className="h-5 w-5 text-neutral-300" />
        </div>
      </Link>

      {/* My Activity */}
      <div className="overflow-hidden rounded-lg bg-white shadow-elevation-3 dark:bg-neutral-900">
        <p className="px-4 pt-3.5 pb-1 text-caption font-semibold text-neutral-400 uppercase tracking-wide">My Activity</p>
        <AccountRow href="/dashboard" icon={Package} label="My Orders" detail={`${orderCount} orders`} />
        <AccountRow href="/account/edit" icon={MapPin} label="Saved Addresses" detail={`${addressCount} saved`} />
        <AccountRow href="/account/favorites" icon={Heart} label="Favorites" detail={`${favoriteCount} items`} iconColor="text-red-400" />
        <AccountRow href="/account/wallet" icon={Wallet} label="Wallet" detail={walletBalance > 0 ? `${new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(walletBalance)}` : "No balance"} iconColor="text-secondary-500" />
        <AccountRow href="/account/loyalty" icon={Gift} label="Rewards & referrals" detail="Points and invites" iconColor="text-amber-500" />
        <AccountRow href="/account/settings" icon={CreditCard} label="Payment Methods" detail="COD & UPI" />
      </div>

      {/* Settings & Preferences */}
      <div className="overflow-hidden rounded-lg bg-white shadow-elevation-3 dark:bg-neutral-900">
        <p className="px-4 pt-3.5 pb-1 text-caption font-semibold text-neutral-400 uppercase tracking-wide">Settings</p>
        <AccountRow href="/account/settings" icon={Settings} label="Preferences" detail="Notifications & theme" />
        {user?.phone && <AccountRow href="/account/edit" icon={Phone} label="Phone" detail={user.phone} />}
        <AccountRow href="/support" icon={HelpCircle} label="Help & Support" detail="Tickets & WhatsApp" />
      </div>

      {/* Logout */}
      <InstallAppButton />

      {/* Store Links */}
      {(storeSettings.googleMapsUrl || storeSettings.instagramUrl || storeSettings.facebookUrl) && (
        <div className="overflow-hidden rounded-lg bg-white shadow-elevation-3 dark:bg-neutral-900 p-4">
          <p className="mb-3 text-center text-caption font-semibold text-neutral-400 uppercase tracking-wide">Find Us</p>
          <StoreInfoLinks
            googleMapsUrl={storeSettings.googleMapsUrl}
            instagramUrl={storeSettings.instagramUrl}
            facebookUrl={storeSettings.facebookUrl}
          />
        </div>
      )}

      <form action={async () => { "use server"; await signOut({ redirectTo: "/" }); }}>
        <button
          type="submit"
          className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-white text-body font-bold text-red-500 shadow-elevation-3 press dark:bg-neutral-900"
        >
          <LogOut className="h-4 w-4" />
          Logout
        </button>
      </form>
    </main>
  );
}

function Stat({ value, label }: { value: string | number; label: string }) {
  return (
    <div className="rounded-2xl border border-white/20 bg-white/12 px-2 py-3 text-center backdrop-blur">
      <p className="text-lg font-black leading-none">{value}</p>
      <p className="mt-1 text-micro font-black uppercase tracking-wide text-white/70">{label}</p>
    </div>
  );
}

function AccountRow({ href, icon: Icon, label, detail, iconColor }: { href: string; icon: React.ElementType; label: string; detail: string; iconColor?: string }) {
  return (
    <Link href={href} className="flex items-center gap-3 px-4 py-3.5 hover:bg-neutral-50/50 dark:hover:bg-neutral-800/50 transition-colors border-t border-neutral-50 dark:border-neutral-800/50 first:border-0 press">
      <div className="h-9 w-9 rounded-xl bg-neutral-50 dark:bg-neutral-800 flex items-center justify-center shrink-0">
        <Icon className={`h-4 w-4 ${iconColor || "text-neutral-500 dark:text-neutral-400"}`} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-body font-medium text-neutral-800 dark:text-white">{label}</p>
      </div>
      <span className="text-caption text-neutral-400 shrink-0">{detail}</span>
      <ChevronRight className="h-4 w-4 text-neutral-300 dark:text-neutral-600 shrink-0" />
    </Link>
  );
}
