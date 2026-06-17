import Link from "next/link";
import { Home, Package, Settings, ShoppingBasket, Users } from "lucide-react";
import { auth } from "@/auth";

const adminNav = [
  { href: "/admin", label: "Dashboard", icon: ShoppingBasket },
  { href: "/admin/products", label: "Products", icon: Package },
  { href: "/admin/orders", label: "Orders", icon: ShoppingBasket },
  { href: "/admin/customers", label: "Customers", icon: Users },
  { href: "/admin/settings", label: "Settings", icon: Settings }
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") return <>{children}</>;

  return (
    <main className="mx-auto grid max-w-7xl gap-5 overflow-x-hidden px-3 pb-36 pt-5 sm:px-6 sm:py-8 lg:grid-cols-[250px_minmax(0,1fr)] lg:px-8">
      <aside className="min-w-0 h-fit rounded-[1.75rem] border border-white/70 bg-card/95 p-4 shadow-soft dark:border-white/10 lg:sticky lg:top-24">
        <div className="rounded-[1.5rem] bg-[linear-gradient(135deg,rgba(15,138,95,0.12),rgba(167,209,41,0.16))] p-4">
          <p className="text-xs font-black uppercase text-primary">Store staff</p>
          <h1 className="mt-1 font-display text-2xl font-black">Admin</h1>
          <Link href="/" className="mt-3 inline-flex items-center gap-2 text-xs font-black text-primary">
            <Home className="h-3.5 w-3.5" />
            View shop
          </Link>
        </div>
        <nav className="no-scrollbar mt-4 flex gap-2 overflow-x-auto lg:grid lg:overflow-visible">
          {adminNav.map((item) => (
            <Link key={item.href} href={item.href} className="flex min-w-fit items-center gap-3 rounded-2xl border border-border bg-background/60 px-4 py-3 text-sm font-black hover:bg-muted lg:min-w-0">
              <item.icon className="h-4 w-4 text-primary" />
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>
      <section className="min-w-0 overflow-hidden">{children}</section>
    </main>
  );
}
