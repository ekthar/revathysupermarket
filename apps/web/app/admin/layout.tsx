import Image from "next/image";
import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { auth, signOut } from "@/auth";
import { isStaffRole } from "@/lib/authz";
import { NewOrderAlert } from "@/components/admin/new-order-alert";
import { StoreToggleButton } from "@/components/admin/store-toggle-button";
import { getPublicShellSettings } from "@/lib/store-settings";
import { getAuthContext } from "@/lib/auth-guard";
import { hasFullAccess } from "@/lib/permissions";
import { AlarmProvider } from "@/components/admin/alarm-provider";
import { AdminCommandPalette } from "@/components/admin/shared";
import { prisma } from "@/lib/prisma";
import { AdminNav } from "@/components/admin/admin-nav";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!isStaffRole(session?.user?.role)) return <>{children}</>;
  const role = session.user.role;
  const userName = session.user.name || session.user.email || "Staff";
  const shell = await getPublicShellSettings();
  const { settings, logoUrl } = shell;

  const ctx = await getAuthContext();
  const can = (perm: string) => {
    if (!ctx) return false;
    if (hasFullAccess(ctx.role)) return true;
    return ctx.permissions.includes(perm);
  };

  // Badge counts
  const [newOrderCount, pendingReturnCount, openRequestCount] = await Promise.all([
    prisma.order.count({ where: { status: "ORDER_RECEIVED", acknowledgedAt: null } }).catch(() => 0),
    prisma.returnRequest.count({ where: { status: "REQUESTED" } }).catch(() => 0),
    prisma.supportTicket.count({ where: { status: { in: ["OPEN", "IN_PROGRESS"] } } }).catch(() => 0),
  ]);

  const nav = {
    "DASHBOARD": [
      { href: "/admin", label: "Command Centre", icon: "LayoutDashboard", badge: 0, show: true },
    ],
    "ORDERS & OPS": [
      { href: "/admin/orders", label: "Orders", icon: "ShoppingBag", badge: newOrderCount, show: can("orders.view") },
      { href: "/admin/dispatch", label: "Dispatch", icon: "Truck", badge: 0, show: can("dispatch.view") },
      { href: "/admin/returns", label: "Returns", icon: "RotateCcw", badge: pendingReturnCount, show: can("returns.view") },
      { href: "/admin/requests", label: "Requests", icon: "MessageSquare", badge: openRequestCount, show: can("requests.view") },
      { href: "/admin/support", label: "Support", icon: "Headphones", badge: 0, show: can("requests.view") },
    ],
    "CATALOGUE": [
      { href: "/admin/products", label: "Products", icon: "Package", badge: 0, show: can("catalogue.view") },
      { href: "/admin/categories", label: "Categories", icon: "Layers", badge: 0, show: can("catalogue.view") },
    ],
    "CUSTOMERS": [
      { href: "/admin/customers", label: "Customers", icon: "Users", badge: 0, show: can("customers.view") },
      { href: "/admin/feedback", label: "Feedback", icon: "Star", badge: 0, show: can("customers.view") },
      { href: "/admin/rewards", label: "Rewards", icon: "Gift", badge: 0, show: can("customers.view") },
    ],
    "MARKETING": [
      { href: "/admin/offers", label: "Offers", icon: "Tag", badge: 0, show: can("marketing.view") },
      { href: "/admin/promo-codes", label: "Promos", icon: "Ticket", badge: 0, show: can("marketing.view") },
      { href: "/admin/push-notifications", label: "Push", icon: "Bell", badge: 0, show: can("marketing.manage") },
      { href: "/admin/whatsapp-log", label: "WhatsApp", icon: "MessageCircle", badge: 0, show: can("marketing.view") },
    ],
    "FINANCE": [
      { href: "/admin/collections", label: "Collections", icon: "IndianRupee", badge: 0, show: can("collections.view") },
      { href: "/admin/billing", label: "Billing", icon: "Receipt", badge: 0, show: can("reports.view") },
      { href: "/admin/reports", label: "Reports", icon: "BarChart3", badge: 0, show: can("reports.view") },
    ],
    "SYSTEM": [
      { href: "/admin/staff", label: "Staff", icon: "ShieldCheck", badge: 0, show: can("staff.manage") },
      { href: "/admin/feature-flags", label: "Feature Flags", icon: "ToggleLeft", badge: 0, show: can("settings.manage") },
      { href: "/admin/settings", label: "Settings", icon: "Settings", badge: 0, show: can("settings.manage") },
      { href: "/admin/delivery-slots", label: "Delivery Slots", icon: "Clock", badge: 0, show: can("settings.manage") },
      { href: "/admin/pricing", label: "Delivery Pricing", icon: "Calculator", badge: 0, show: can("pricing.manage") },
      { href: "/admin/audit-log", label: "Audit Log", icon: "FileText", badge: 0, show: can("audit.view") },
    ],
  };

  // Filter by permissions
  const filteredNav = Object.fromEntries(
    Object.entries(nav).map(([group, items]) => [
      group,
      items.filter((item) => item.show),
    ]).filter(([, items]) => (items as unknown[]).length > 0)
  ) as Record<string, { href: string; label: string; icon: string; badge: number }[]>;

  return (
    <div className="admin-shell flex min-h-[100dvh] bg-neutral-50 dark:bg-neutral-950">
      <NewOrderAlert />
      <AdminCommandPalette />

      {/* Sidebar */}
      <AdminNav
        nav={filteredNav}
        storeName={settings.storeName}
        logoUrl={logoUrl}
        userName={userName}
        role={role}
      />

      {/* Main area */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top bar */}
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-neutral-200 bg-white/80 px-4 backdrop-blur-xl dark:border-neutral-800 dark:bg-neutral-900/80 lg:px-6 print:hidden">
          <div className="flex items-center gap-3">
            {/* Mobile menu trigger rendered in AdminNav */}
            <div className="lg:hidden" id="admin-mobile-trigger" />
            <StoreToggleButton initialIsOpen={settings.isStoreOpen} />
            <button
              className="hidden items-center gap-2 rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1.5 text-xs text-neutral-500 transition-colors hover:border-neutral-300 hover:bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-400 sm:inline-flex"
              data-cmd-k-trigger
            >
              <kbd className="font-mono text-[10px]">⌘K</kbd>
              <span>Search...</span>
            </button>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-400 dark:hover:bg-emerald-900/40"
            >
              View Store
            </Link>
            <form action={async () => { "use server"; await signOut({ redirectTo: "/admin/login" }); }}>
              <button
                type="submit"
                className="rounded-full bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-100 dark:bg-red-950/30 dark:text-red-400 dark:hover:bg-red-900/30"
                title="Logout"
              >
                Logout
              </button>
            </form>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <AlarmProvider>{children}</AlarmProvider>
        </main>
      </div>
    </div>
  );
}
