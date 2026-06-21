import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { auth, signOut } from "@/auth";
import { prisma } from "@/lib/prisma";
import { ChevronRight, CreditCard, Gift, Heart, HelpCircle, LogOut, MapPin, Package, Pencil, Phone, Settings, User, Wallet } from "lucide-react";
import { ThemeToggleInline } from "@/components/ui/theme-toggle-inline";
import { InstallAppButton } from "@/components/install-app-button";

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

  return (
    <main className="mx-auto min-h-screen max-w-lg space-y-4 bg-[#F7F7FA] px-4 pb-28 pt-8">
      <div className="text-center">
        <p className="text-[11px] font-black uppercase tracking-[0.28em] text-slate-400">Profile</p>
        <h1 className="font-display text-lg font-black tracking-[-0.04em] text-slate-950">Your account</h1>
      </div>

      {/* Profile card */}
      <div className="relative overflow-hidden rounded-[1.75rem] bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-700 p-4 text-white shadow-[0_24px_65px_-36px_rgba(5,150,105,0.9)]">
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
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/75">Member · Gold</p>
            <p className="text-[20px] font-black leading-tight text-white truncate">{user?.name || "Customer"}</p>
            <p className="text-[12px] font-semibold text-white/80 truncate">{user?.email || user?.phone || "No contact info"}</p>
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
      <Link href="/account/wallet" className="block rounded-[1.35rem] bg-white p-4 text-slate-950 shadow-[0_18px_45px_-32px_rgba(15,23,42,0.55)] press">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50">
              <Wallet className="h-5 w-5 text-emerald-500" />
            </div>
            <div>
              <p className="text-[11px] font-bold text-slate-400">Wallet Balance</p>
              <p className="text-[20px] font-bold tracking-tight">{new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(walletBalance)}</p>
            </div>
          </div>
          <ChevronRight className="h-5 w-5 text-slate-300" />
        </div>
      </Link>

      {/* My Activity */}
      <div className="overflow-hidden rounded-[1.35rem] bg-white shadow-[0_18px_45px_-32px_rgba(15,23,42,0.55)] dark:bg-slate-900">
        <p className="px-4 pt-3.5 pb-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wide">My Activity</p>
        <AccountRow href="/dashboard" icon={Package} label="My Orders" detail={`${orderCount} orders`} />
        <AccountRow href="/account/edit" icon={MapPin} label="Saved Addresses" detail={`${addressCount} saved`} />
        <AccountRow href="/account/favorites" icon={Heart} label="Favorites" detail={`${favoriteCount} items`} iconColor="text-red-400" />
        <AccountRow href="/account/wallet" icon={Wallet} label="Wallet" detail={walletBalance > 0 ? `${new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(walletBalance)}` : "No balance"} iconColor="text-emerald-500" />
        <AccountRow href="/account/loyalty" icon={Gift} label="Rewards & referrals" detail="Points and invites" iconColor="text-amber-500" />
        <AccountRow href="/account/settings" icon={CreditCard} label="Payment Methods" detail="COD & UPI" />
      </div>

      {/* Settings & Preferences */}
      <div className="overflow-hidden rounded-[1.35rem] bg-white shadow-[0_18px_45px_-32px_rgba(15,23,42,0.55)] dark:bg-slate-900">
        <p className="px-4 pt-3.5 pb-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Settings</p>
        <AccountRow href="/account/settings" icon={Settings} label="Preferences" detail="Notifications & theme" />
        {user?.phone && <AccountRow href="/account/edit" icon={Phone} label="Phone" detail={user.phone} />}
        <AccountRow href="/support" icon={HelpCircle} label="Help & Support" detail="Tickets & WhatsApp" />
      </div>

      {/* Appearance */}
      <div className="overflow-hidden rounded-[1.35rem] bg-white shadow-[0_18px_45px_-32px_rgba(15,23,42,0.55)] dark:bg-slate-900">
        <p className="px-4 pt-3.5 pb-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Appearance</p>
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center shrink-0">
              <Settings className="h-4 w-4 text-slate-500 dark:text-slate-400" />
            </div>
            <p className="text-[13px] font-medium text-slate-800 dark:text-white">Dark Mode</p>
          </div>
          <ThemeToggleInline />
        </div>
      </div>

      {/* Logout */}
      <InstallAppButton />
      <form action={async () => { "use server"; await signOut({ redirectTo: "/" }); }}>
        <button
          type="submit"
          className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-white text-[14px] font-bold text-red-500 shadow-[0_18px_45px_-32px_rgba(15,23,42,0.55)] press dark:bg-slate-900"
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
      <p className="mt-1 text-[9px] font-black uppercase tracking-wide text-white/70">{label}</p>
    </div>
  );
}

function AccountRow({ href, icon: Icon, label, detail, iconColor }: { href: string; icon: React.ElementType; label: string; detail: string; iconColor?: string }) {
  return (
    <Link href={href} className="flex items-center gap-3 px-4 py-3.5 hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors border-t border-slate-50 dark:border-slate-800/50 first:border-0 press">
      <div className="h-9 w-9 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center shrink-0">
        <Icon className={`h-4 w-4 ${iconColor || "text-slate-500 dark:text-slate-400"}`} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-medium text-slate-800 dark:text-white">{label}</p>
      </div>
      <span className="text-[11px] text-slate-400 shrink-0">{detail}</span>
      <ChevronRight className="h-4 w-4 text-slate-300 dark:text-slate-600 shrink-0" />
    </Link>
  );
}
