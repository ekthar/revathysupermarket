/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { BarChart3, Bell, ClipboardList, Home, LayoutDashboard, LogOut, Package, RotateCcw, Settings, ShoppingBag, Users } from "lucide-react";
import { auth, signOut } from "@/auth";
import { canManageProducts, canManageReturns, canManageSettings, canManageStaff, canViewReports, isStaffRole } from "@/lib/authz";
import { roleLabel } from "@/lib/roles";
import { NewOrderAlert } from "@/components/admin/new-order-alert";
import { prisma } from "@/lib/prisma";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { StoreToggleButton } from "@/components/admin/store-toggle-button";
import { getPublicStoreSettings } from "@/lib/store-settings";
import { InstallAppButton } from "@/components/install-app-button";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!isStaffRole(session?.user?.role)) return <>{children}</>;
  const role = session.user.role;
  const userName = session.user.name || session.user.email || "Staff";
  const settings = await getPublicStoreSettings();

  // Fetch logo URL
  const logoSetting = await prisma.setting.findUnique({ where: { key: "logoUrl" } }).catch(() => null);
  const logoUrl = logoSetting?.value || null;

  // Fetch badge counts
  const [newOrderCount, pendingReturnCount] = await Promise.all([
    prisma.order.count({ where: { status: "ORDER_RECEIVED", acknowledgedAt: null } }).catch(() => 0),
    prisma.returnRequest.count({ where: { status: "REQUESTED" } }).catch(() => 0)
  ]);

  const nav = [
    { href: "/admin", label: "Dashboard", icon: "LayoutDashboard", group: "Operations", show: true, badge: 0 },
    { href: "/admin/orders", label: "Orders", icon: "ShoppingBag", group: "Operations", show: true, badge: newOrderCount },
    { href: "/admin/returns", label: "Returns", icon: "RotateCcw", group: "Operations", show: canManageReturns(role), badge: pendingReturnCount },
    { href: "/admin/support", label: "Support", icon: "Bell", group: "Operations", show: canViewReports(role), badge: 0 },
    { href: "/admin/delivery-slots", label: "Delivery Slots", icon: "ClipboardList", group: "Operations", show: canManageSettings(role), badge: 0 },
    { href: "/admin/products", label: "Products", icon: "Package", group: "Catalogue", show: canManageProducts(role), badge: 0 },
    { href: "/admin/categories", label: "Categories", icon: "Package", group: "Catalogue", show: canManageProducts(role), badge: 0 },
    { href: "/admin/customers", label: "Customers", icon: "Users", group: "Customers", show: canViewReports(role), badge: 0 },
    { href: "/admin/feedback", label: "Feedback", icon: "Users", group: "Customers", show: canViewReports(role), badge: 0 },
    { href: "/admin/promo-codes", label: "Promos", icon: "Bell", group: "Marketing", show: canManageSettings(role), badge: 0 },
    { href: "/admin/offers", label: "Offers", icon: "Bell", group: "Marketing", show: canManageSettings(role), badge: 0 },
    { href: "/admin/push-notifications", label: "Push", icon: "Bell", group: "Marketing", show: canManageSettings(role), badge: 0 },
    { href: "/admin/whatsapp-log", label: "WhatsApp", icon: "Bell", group: "Marketing", show: canViewReports(role), badge: 0 },
    { href: "/admin/reports", label: "Reports", icon: "BarChart3", group: "Finance", show: canViewReports(role), badge: 0 },
    { href: "/admin/billing", label: "Billing", icon: "BarChart3", group: "Finance", show: canViewReports(role), badge: 0 },
    { href: "/admin/staff", label: "Staff", icon: "Users", group: "Administration", show: canManageStaff(role), badge: 0 },
    { href: "/admin/audit-log", label: "Audit Log", icon: "ClipboardList", group: "Administration", show: canViewReports(role), badge: 0 },
    { href: "/admin/settings", label: "Settings", icon: "Settings", group: "Administration", show: canManageSettings(role), badge: 0 }
  ];

  return (
    <div className="admin-shell min-h-screen bg-[#f8f9fb] dark:bg-slate-950">
      <NewOrderAlert />

      {/* Top bar */}
      <header className="sticky top-0 z-40 bg-white/90 dark:bg-slate-950/90 backdrop-blur-xl border-b border-slate-200/60 dark:border-slate-800/60 print:hidden">
        <div className="max-w-7xl mx-auto flex items-center justify-between h-14 px-4 lg:px-6">
          <div className="flex items-center gap-3">
            <Link href="/admin" className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center overflow-hidden">
                {logoUrl ? (
                  <img src={logoUrl} alt={settings.storeName} className="h-full w-full object-contain" />
                ) : (
                  <ShoppingBag className="h-4 w-4 text-white" />
                )}
              </div>
              <span className="text-[14px] font-bold text-slate-900 dark:text-white hidden sm:block">{settings.storeName} Admin</span>
            </Link>
            <StoreToggleButton initialIsOpen={settings.isStoreOpen} />
            <div className="hidden md:block"><InstallAppButton compact /></div>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/" className="text-[12px] font-semibold text-primary flex items-center gap-1.5 hover:underline px-3 py-1.5 rounded-full bg-primary/5 dark:bg-primary/10">
              <Home className="h-3.5 w-3.5" /> View Store
            </Link>
            <div className="h-4 w-px bg-slate-200 dark:bg-slate-700" />
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300">{userName.charAt(0).toUpperCase()}</span>
              </div>
              <div className="text-right hidden sm:block">
                <p className="text-[12px] font-semibold text-slate-900 dark:text-white">{userName}</p>
                <p className="text-[10px] text-slate-400">{roleLabel(role)}</p>
              </div>
              <form action={async () => { "use server"; await signOut({ redirectTo: "/admin/login" }); }}>
                <button type="submit" className="flex h-8 w-8 items-center justify-center rounded-full bg-red-50 dark:bg-red-950/30 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors press" title="Logout">
                  <LogOut className="h-3.5 w-3.5 text-red-500" />
                </button>
              </form>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto lg:grid lg:grid-cols-[200px_1fr] lg:gap-6 px-4 lg:px-6 py-5">
        {/* Sidebar - client component for active state */}
        <div className="print:hidden">
          <AdminSidebar nav={nav.filter((n) => n.show)} />
        </div>

        {/* Main content */}
        <main className="min-w-0">{children}</main>
      </div>
    </div>
  );
}
