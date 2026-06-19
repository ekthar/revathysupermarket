import Link from "next/link";
import { BarChart3, Bell, ClipboardList, Home, LayoutDashboard, LogOut, Package, RotateCcw, Settings, ShoppingBag, Users } from "lucide-react";
import { auth, signOut } from "@/auth";
import { canManageProducts, canManageReturns, canManageSettings, canManageStaff, canViewReports, isStaffRole } from "@/lib/authz";
import { roleLabel } from "@/lib/roles";
import { NewOrderAlert } from "@/components/admin/new-order-alert";
import { prisma } from "@/lib/prisma";
import { AdminSidebar } from "@/components/admin/admin-sidebar";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!isStaffRole(session?.user?.role)) return <>{children}</>;
  const role = session.user.role;
  const userName = session.user.name || session.user.email || "Staff";

  // Fetch badge counts
  const [newOrderCount, pendingReturnCount] = await Promise.all([
    prisma.order.count({ where: { status: "ORDER_RECEIVED", acknowledgedAt: null } }).catch(() => 0),
    prisma.returnRequest.count({ where: { status: "REQUESTED" } }).catch(() => 0)
  ]);

  const nav = [
    { href: "/admin", label: "Dashboard", icon: "LayoutDashboard", show: true, badge: 0 },
    { href: "/admin/orders", label: "Orders", icon: "ShoppingBag", show: true, badge: newOrderCount },
    { href: "/admin/products", label: "Products", icon: "Package", show: canManageProducts(role), badge: 0 },
    { href: "/admin/returns", label: "Returns", icon: "RotateCcw", show: canManageReturns(role), badge: pendingReturnCount },
    { href: "/admin/customers", label: "Customers", icon: "Users", show: canViewReports(role), badge: 0 },
    { href: "/admin/reports", label: "Reports", icon: "BarChart3", show: canViewReports(role), badge: 0 },
    { href: "/admin/staff", label: "Staff", icon: "Users", show: canManageStaff(role), badge: 0 },
    { href: "/admin/whatsapp-log", label: "WhatsApp", icon: "Bell", show: canViewReports(role), badge: 0 },
    { href: "/admin/audit-log", label: "Audit Log", icon: "ClipboardList", show: canViewReports(role), badge: 0 },
    { href: "/admin/settings", label: "Settings", icon: "Settings", show: canManageSettings(role), badge: 0 }
  ];

  return (
    <div className="min-h-screen bg-[#f8f9fb] dark:bg-slate-950">
      <NewOrderAlert />

      {/* Top bar */}
      <header className="sticky top-0 z-40 bg-white/90 dark:bg-slate-950/90 backdrop-blur-xl border-b border-slate-200/60 dark:border-slate-800/60">
        <div className="max-w-7xl mx-auto flex items-center justify-between h-14 px-4 lg:px-6">
          <div className="flex items-center gap-3">
            <Link href="/admin" className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                <ShoppingBag className="h-4 w-4 text-white" />
              </div>
              <span className="text-[14px] font-bold text-slate-900 hidden sm:block">Revathy Admin</span>
            </Link>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/" className="text-[12px] font-semibold text-primary flex items-center gap-1.5 hover:underline px-3 py-1.5 rounded-full bg-primary/5">
              <Home className="h-3.5 w-3.5" /> View Store
            </Link>
            <div className="h-4 w-px bg-slate-200" />
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center">
                <span className="text-[11px] font-bold text-slate-600">{userName.charAt(0).toUpperCase()}</span>
              </div>
              <div className="text-right hidden sm:block">
                <p className="text-[12px] font-semibold text-slate-900">{userName}</p>
                <p className="text-[10px] text-slate-400">{roleLabel(role)}</p>
              </div>
              <form action={async () => { "use server"; await signOut({ redirectTo: "/admin/login" }); }}>
                <button type="submit" className="flex h-8 w-8 items-center justify-center rounded-full bg-red-50 hover:bg-red-100 transition-colors press" title="Logout">
                  <LogOut className="h-3.5 w-3.5 text-red-500" />
                </button>
              </form>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto lg:grid lg:grid-cols-[200px_1fr] lg:gap-6 px-4 lg:px-6 py-5">
        {/* Sidebar - client component for active state */}
        <AdminSidebar nav={nav.filter((n) => n.show)} />

        {/* Main content */}
        <main className="min-w-0">{children}</main>
      </div>
    </div>
  );
}
