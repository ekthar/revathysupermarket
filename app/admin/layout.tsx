import Link from "next/link";
import { BarChart3, Bell, ClipboardList, Home, LayoutDashboard, Package, RotateCcw, Settings, ShoppingBag, Users } from "lucide-react";
import { auth } from "@/auth";
import { canManageProducts, canManageReturns, canManageSettings, canManageStaff, canViewReports, isStaffRole } from "@/lib/authz";
import { roleLabel } from "@/lib/roles";
import { NewOrderAlert } from "@/components/admin/new-order-alert";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!isStaffRole(session?.user?.role)) return <>{children}</>;
  const role = session.user.role;
  const userName = session.user.name || session.user.email || "Staff";

  const nav = [
    { href: "/admin", label: "Dashboard", icon: LayoutDashboard, show: true },
    { href: "/admin/orders", label: "Orders", icon: ShoppingBag, show: true },
    { href: "/admin/products", label: "Products", icon: Package, show: canManageProducts(role) },
    { href: "/admin/returns", label: "Returns", icon: RotateCcw, show: canManageReturns(role) },
    { href: "/admin/customers", label: "Customers", icon: Users, show: canViewReports(role) },
    { href: "/admin/reports", label: "Reports", icon: BarChart3, show: canViewReports(role) },
    { href: "/admin/staff", label: "Staff", icon: Users, show: canManageStaff(role) },
    { href: "/admin/whatsapp-log", label: "WhatsApp", icon: Bell, show: canViewReports(role) },
    { href: "/admin/audit-log", label: "Audit Log", icon: ClipboardList, show: canViewReports(role) },
    { href: "/admin/settings", label: "Settings", icon: Settings, show: canManageSettings(role) }
  ];

  return (
    <div className="min-h-screen bg-[#f5f5f7]">
      {/* Order ring notification - works on all admin pages */}
      <NewOrderAlert />

      {/* Top bar */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-slate-200/60">
        <div className="max-w-7xl mx-auto flex items-center justify-between h-14 px-4 lg:px-6">
          <div className="flex items-center gap-3">
            <Link href="/admin" className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                <ShoppingBag className="h-4 w-4 text-white" />
              </div>
              <span className="text-[15px] font-semibold text-slate-900 hidden sm:block">Admin</span>
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/" className="text-xs font-medium text-primary flex items-center gap-1 hover:underline">
              <Home className="h-3.5 w-3.5" /> View Store
            </Link>
            <div className="h-4 w-px bg-slate-200" />
            <div className="text-right">
              <p className="text-[12px] font-medium text-slate-900">{userName}</p>
              <p className="text-[10px] text-slate-400">{roleLabel(role)}</p>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto lg:grid lg:grid-cols-[220px_1fr] lg:gap-6 px-4 lg:px-6 py-5">
        {/* Sidebar */}
        <aside className="hidden lg:block">
          <nav className="sticky top-20 space-y-0.5">
            {nav.filter((n) => n.show).map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium text-slate-600 hover:bg-white hover:text-slate-900 hover:shadow-sm transition-all"
              >
                <item.icon className="h-4 w-4 text-slate-400" />
                {item.label}
              </Link>
            ))}
          </nav>
        </aside>

        {/* Mobile nav - horizontal scroll */}
        <div className="lg:hidden mb-4 -mx-4 px-4">
          <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-1">
            {nav.filter((n) => n.show).map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-full bg-white border border-slate-200 text-[12px] font-medium text-slate-600 shadow-sm press"
              >
                <item.icon className="h-3.5 w-3.5" />
                {item.label}
              </Link>
            ))}
          </div>
        </div>

        {/* Main content */}
        <main className="min-w-0">{children}</main>
      </div>
    </div>
  );
}
