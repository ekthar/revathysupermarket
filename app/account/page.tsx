import { redirect } from "next/navigation";
import Link from "next/link";
import { auth, signOut } from "@/auth";
import { prisma } from "@/lib/prisma";
import { ChevronRight, LogOut, MapPin, Package, Phone, User } from "lucide-react";

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
    <main className="max-w-lg mx-auto px-4 py-5">
      {/* Profile card */}
      <div className="rounded-lg border border-slate-100 bg-white p-4">
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 rounded-full bg-primary/10 flex items-center justify-center text-primary">
            <User className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-900">{user?.name || "Customer"}</p>
            <p className="text-xs text-slate-500">{user?.email || user?.phone || "No contact"}</p>
          </div>
        </div>
      </div>

      {/* Links */}
      <div className="mt-4 rounded-lg border border-slate-100 bg-white overflow-hidden divide-y divide-slate-50">
        <AccountLink href="/dashboard" icon={Package} label="My Orders" detail={`${orderCount} orders`} />
        <AccountLink href="/account" icon={MapPin} label="Saved Addresses" detail={`${addressCount} saved`} />
        {user?.phone && <AccountLink href="/account" icon={Phone} label="Phone" detail={user.phone} />}
      </div>

      {/* Logout */}
      <form action={async () => { "use server"; await signOut({ redirectTo: "/" }); }}>
        <button
          type="submit"
          className="mt-4 flex w-full items-center justify-center gap-2 h-11 rounded-lg border border-slate-200 text-sm font-medium text-red-600 active:scale-[0.98] transition"
        >
          <LogOut className="h-4 w-4" />
          Logout
        </button>
      </form>
    </main>
  );
}

function AccountLink({ href, icon: Icon, label, detail }: { href: string; icon: React.ElementType; label: string; detail: string }) {
  return (
    <Link href={href} className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition">
      <Icon className="h-4 w-4 text-slate-400" />
      <div className="flex-1">
        <p className="text-sm font-medium text-slate-800">{label}</p>
        <p className="text-[11px] text-slate-400">{detail}</p>
      </div>
      <ChevronRight className="h-4 w-4 text-slate-300" />
    </Link>
  );
}
