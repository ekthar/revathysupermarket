import Image from "next/image";
import Link from "next/link";
import { BarChart3, Bell, ClipboardList, CreditCard, Home, LayoutDashboard, LogOut, MessageSquare, Package, RotateCcw, Settings, ShieldCheck, ShoppingBag, Tag, Ticket, Truck, Users } from "lucide-react";
import { auth, signOut } from "@/auth";
import { isStaffRole } from "@/lib/authz";
import { roleLabel } from "@/lib/roles";
import { NewOrderAlert } from "@/components/admin/new-order-alert";
import { prisma } from "@/lib/prisma";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { StoreToggleButton } from "@/components/admin/store-toggle-button";
import { getPublicStoreSettings } from "@/lib/store-settings";
import { InstallAppButton } from "@/components/install-app-button";
import { getAuthContext } from "@/lib/auth-guard";
import { hasPermission, hasFullAccess, type AuthContext } from "@/lib/permissions";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!isStaffRole(session?.user?.role)) return <>{children}</>;
  const role = session.user.role;
  const userName = session.user.name || session.user.email || "Staff";
  const settings = await getPublicStoreSettings();

  // Fetch logo URL
  const logoSetting = await prisma.setting.findUnique({ where: { key: "logoUrl" } }).catch(() => null);
  const logoUrl = logoSetting?.value || null;

  // Get permission context
  const ctx = await getAuthContext();
  const can = (perm: string) => {
    if (!ctx) return false;
    if (hasFullAccess(ctx.role)) return true;
    return ctx.permissions.includes(perm);
  };

  // Fetch badge counts
  const [newOrderCount, pendingReturnCount, openRequestCount] = await Promise.all([
    prisma.order.count({ where: { status: "ORDER_RECEIVED", acknowledgedAt: null } }).catch(() => 0),
    prisma.returnRequest.count({ where: { status: "REQUESTED" } }).catch(() => 0),
    prisma.supportTicket.count({ where: { status: { in: ["OPEN", "IN_PROGRESS"] } } }).catch(() => 0),
  ]);

  const nav = [
    // Operations
    { href: "/admin", label: "Command Centre", icon: "LayoutDashboard", group: "Operations", show: true, badge: 0 },
    { href: "/admin/orders", label: "Orders", icon: "ShoppingBag", group: "Operations", show: can("orders.view"), badge: newOrderCount },
    { href: "/admin/requests", label: "Customer Requests", icon: "MessageSquare", group: "Operations", show: can("requests.view"), badge: openRequestCount },
    { href: "/admin/dispatch", label: "Dispatch", icon: "Truck", group: "Operations", show: can("dispatch.view"), badge: 0 },
    { href: "/admin/returns", label: "Returns", icon: "RotateCcw", group: "Operations", show: can("returns.view"), badge: pendingReturnCount },

    // Catalogue
    { href: "/admin/products", label: "Products", icon: "Package", group: "Catalogue", show: can("catalogue.view"), badge: 0 },
    { href: "/admin/categories", label: "Categories", icon: "Package", group: "Catalogue", show: can("catalogue.view"), badge: 0 },

    // Customers
    { href: "/admin/customers", label: "Customers", icon: "Users", group: "Customers", show: can("customers.view"), badge: 0 },
    { href: "/admin/feedback", label: "Feedback", icon: "Users", group: "Customers", show: can("customers.view"), badge: 0 },
    { href: "/admin/rewards", label: "Rewards Points", icon: "Gift", group: "Customers", show: can("customers.view"), badge: 0 },

    // Marketing
    { href: "/admin/offers", label: "Offers", icon: "Tag", group: "Marketing", show: can("marketing.view"), badge: 0 },
    { href: "/admin/promo-codes", label: "Promos", icon: "Ticket", group: "Marketing", show: can("marketing.view"), badge: 0 },
    { href: "/admin/push-notifications", label: "Push", icon: "Bell", group: "Marketing", show: can("marketing.manage"), badge: 0 },
    { href: "/admin/whatsapp-log", label: "WhatsApp", icon: "MessageSquare", group: "Marketing", show: can("marketing.view"), badge: 0 },

    // Finance
    { href: "/admin/collections", label: "Collections", icon: "CreditCard", group: "Finance", show: can("collections.view"), badge: 0 },
    { href: "/admin/billing", label: "Billing", icon: "BarChart3", group: "Finance", show: can("reports.view"), badge: 0 },
    { href: "/admin/reports", label: "Reports", icon: "BarChart3", group: "Finance", show: can("reports.view"), badge: 0 },

    // Administration
    { href: "/admin/staff", label: "Staff", icon: "ShieldCheck", group: "Administration", show: can("staff.manage"), badge: 0 },
    { href: "/admin/delivery-slots", label: "Delivery Slots", icon: "ClipboardList", group: "Administration", show: can("settings.manage"), badge: 0 },
    { href: "/admin/pricing", label: "Delivery Pricing", icon: "Tag", group: "Administration", show: can("pricing.manage"), badge: 0 },
    { href: "/admin/settings", label: "Settings", icon: "Settings", group: "Administration", show: can("settings.manage"), badge: 0 },
    { href: "/admin/audit-log", label: "Audit Log", icon: "ClipboardList", group: "Administration", show: can("audit.view"), badge: 0 },
  ];

  return (
    <div className="admin-shell min-h-screen bg-[#f8f9fb] dark:bg-slate-950">
      <NewOrderAlert />

      {/* Top bar */}
      <header className="sticky top-0 z-40 bg-white/90 dark:bg-slate-950/90 backdrop-blur-xl border-b border-slate-200/60 dark:border-slate-800/60 print:hidden">
        <div className="max-w-7xl mx-auto flex items-center justify-between h-14 px-4 lg:px-6">
          <div className="flex items-center gap-3">
            <Link href="/admin" className="flex items-center gap-2.5">
              <div className="relative h-8 w-8 rounded-lg bg-primary flex items-center justify-center overflow-hidden">
                {logoUrl ? (
                  <Image src={logoUrl} alt={settings.storeName} fill className="object-contain" unoptimized />
                ) : (
                  <ShoppingBag className="h-4 w-4 text-white" />
                )}
              </div>
              <span className="text-body font-bold text-slate-900 dark:text-white hidden sm:block">{settings.storeName} Admin</span>
            </Link>
            <StoreToggleButton initialIsOpen={settings.isStoreOpen} />
            <div className="hidden md:block"><InstallAppButton compact /></div>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/" className="text-caption font-semibold text-primary flex items-center gap-1.5 hover:underline px-3 py-1.5 rounded-full bg-primary/5 dark:bg-primary/10">
              <Home className="h-3.5 w-3.5" /> View Store
            </Link>
            <div className="h-4 w-px bg-slate-200 dark:bg-slate-700" />
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                <span className="text-caption font-bold text-slate-600 dark:text-slate-300">{userName.charAt(0).toUpperCase()}</span>
              </div>
              <div className="text-right hidden sm:block">
                <p className="text-caption font-semibold text-slate-900 dark:text-white">{userName}</p>
                <p className="text-micro text-slate-400">{roleLabel(role)}</p>
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

      <div className="max-w-7xl mx-auto px-4 lg:px-6 py-5">
        {/* Responsive admin navigation */}
        <div className="print:hidden">
          <AdminSidebar nav={nav.filter((n) => n.show)} />
        </div>

        {/* Main content */}
        <main className="mt-5 min-w-0">{children}</main>
      </div>
    </div>
  );
}
