import { redirect } from "next/navigation";
import Link from "next/link";
import { auth, signOut } from "@/auth";
import { prisma } from "@/lib/prisma";
import { ChevronRight, CreditCard, Heart, HelpCircle, LogOut, MapPin, Package, Phone, Settings, User } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login?callbackUrl=/account");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { name: true, email: true, phone: true }
  });

  const orderCount = await prisma.order.count({ where: { userId: session.user.id } }).catch(() => 0);
  const addressCount = await prisma.address.count({ where: { userId: session.user.id } }).catch(() => 0);

  return (
    <main className="max-w-lg mx-auto px-4 py-5 space-y-4">
      {/* Profile card */}
      <div className="rounded-2xl bg-white card-shadow p-4">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
            <User className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[15px] font-semibold text-slate-900 truncate">{user?.name || "Customer"}</p>
            <p className="text-[12px] text-slate-500 truncate">{user?.email || user?.phone || "No contact info"}</p>
          </div>
          <Link href="/account" className="h-8 w-8 rounded-full bg-slate-50 flex items-center justify-center">
            <Settings className="h-4 w-4 text-slate-400" />
          </Link>
        </div>
      </div>

      {/* My Activity */}
      <div className="rounded-2xl bg-white card-shadow overflow-hidden">
        <p className="px-4 pt-3.5 pb-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wide">My Activity</p>
        <AccountRow href="/dashboard" icon={Package} label="My Orders" detail={`${orderCount} orders`} />
        <AccountRow href="/account" icon={MapPin} label="Saved Addresses" detail={`${addressCount} saved`} />
        <AccountRow href="/account" icon={CreditCard} label="Payment Methods" detail="COD & UPI" />
        <AccountRow href="/account" icon={Heart} label="Favorites" detail="Coming soon" />
      </div>

      {/* Help & Info */}
      <div className="rounded-2xl bg-white card-shadow overflow-hidden">
        <p className="px-4 pt-3.5 pb-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Help & Info</p>
        {user?.phone && <AccountRow href="/account" icon={Phone} label="Phone" detail={user.phone} />}
        <AccountRow href="/account" icon={HelpCircle} label="Help & Support" detail="Contact us" />
      </div>

      {/* Logout */}
      <form action={async () => { "use server"; await signOut({ redirectTo: "/" }); }}>
        <button
          type="submit"
          className="flex w-full items-center justify-center gap-2 h-12 rounded-2xl bg-white card-shadow text-[14px] font-medium text-red-500 press"
        >
          <LogOut className="h-4 w-4" />
          Logout
        </button>
      </form>
    </main>
  );
}

function AccountRow({ href, icon: Icon, label, detail }: { href: string; icon: React.ElementType; label: string; detail: string }) {
  return (
    <Link href={href} className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50/50 transition-colors border-t border-slate-50 first:border-0">
      <div className="h-8 w-8 rounded-lg bg-slate-50 flex items-center justify-center shrink-0">
        <Icon className="h-4 w-4 text-slate-500" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-medium text-slate-800">{label}</p>
      </div>
      <span className="text-[11px] text-slate-400 shrink-0">{detail}</span>
      <ChevronRight className="h-4 w-4 text-slate-300 shrink-0" />
    </Link>
  );
}
