import { redirect } from "next/navigation";
import Link from "next/link";
import { auth, signOut } from "@/auth";
import { prisma } from "@/lib/prisma";
import { ChevronRight, CreditCard, Heart, HelpCircle, LogOut, MapPin, Package, Pencil, Phone, Settings, User, Wallet } from "lucide-react";
import { ThemeToggleInline } from "@/components/ui/theme-toggle-inline";

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
    <main className="max-w-lg mx-auto px-4 py-5 space-y-4">
      {/* Profile card */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 card-shadow p-4">
        <div className="flex items-center gap-3">
          <div className="h-14 w-14 rounded-full overflow-hidden bg-gradient-to-br from-primary/20 to-primary/5 dark:from-primary/10 dark:to-slate-800 flex items-center justify-center shrink-0">
            {user?.image ? (
              <img src={user.image} alt="Profile" className="h-full w-full object-cover" />
            ) : (
              <User className="h-6 w-6 text-primary/60" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[15px] font-semibold text-slate-900 dark:text-white truncate">{user?.name || "Customer"}</p>
            <p className="text-[12px] text-slate-500 dark:text-slate-400 truncate">{user?.email || user?.phone || "No contact info"}</p>
          </div>
          <Link href="/account/edit" className="h-9 w-9 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center press">
            <Pencil className="h-4 w-4 text-slate-400 dark:text-slate-500" />
          </Link>
        </div>
      </div>

      {/* Wallet Balance Card */}
      <Link href="/account/wallet" className="block rounded-2xl bg-gradient-to-br from-primary to-emerald-600 p-4 text-white shadow-md shadow-primary/15 press">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-white/15 flex items-center justify-center">
              <Wallet className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-[11px] text-white/70 font-medium">Wallet Balance</p>
              <p className="text-[20px] font-bold tracking-tight">{new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(walletBalance)}</p>
            </div>
          </div>
          <ChevronRight className="h-5 w-5 text-white/60" />
        </div>
      </Link>

      {/* My Activity */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 card-shadow overflow-hidden">
        <p className="px-4 pt-3.5 pb-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wide">My Activity</p>
        <AccountRow href="/dashboard" icon={Package} label="My Orders" detail={`${orderCount} orders`} />
        <AccountRow href="/account/edit" icon={MapPin} label="Saved Addresses" detail={`${addressCount} saved`} />
        <AccountRow href="/account/favorites" icon={Heart} label="Favorites" detail={`${favoriteCount} items`} iconColor="text-red-400" />
        <AccountRow href="/account/wallet" icon={Wallet} label="Wallet" detail={walletBalance > 0 ? `${new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(walletBalance)}` : "No balance"} iconColor="text-emerald-500" />
        <AccountRow href="/account/settings" icon={CreditCard} label="Payment Methods" detail="COD & UPI" />
      </div>

      {/* Settings & Preferences */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 card-shadow overflow-hidden">
        <p className="px-4 pt-3.5 pb-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Settings</p>
        <AccountRow href="/account/settings" icon={Settings} label="Preferences" detail="Notifications & theme" />
        {user?.phone && <AccountRow href="/account/edit" icon={Phone} label="Phone" detail={user.phone} />}
        <AccountRow href="/account/settings" icon={HelpCircle} label="Help & Support" detail="Contact us" />
      </div>

      {/* Appearance */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 card-shadow overflow-hidden">
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
      <form action={async () => { "use server"; await signOut({ redirectTo: "/" }); }}>
        <button
          type="submit"
          className="flex w-full items-center justify-center gap-2 h-12 rounded-2xl bg-white dark:bg-slate-900 card-shadow text-[14px] font-medium text-red-500 press"
        >
          <LogOut className="h-4 w-4" />
          Logout
        </button>
      </form>
    </main>
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
