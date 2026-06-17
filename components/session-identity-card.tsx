"use client";

import Link from "next/link";
import { signOut } from "next-auth/react";
import { LogOut, ShieldCheck, ShoppingBag, Truck, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { roleLabel } from "@/lib/roles";

export type SessionIdentity = {
  id: string;
  name?: string | null;
  email?: string | null;
  role?: string | null;
} | null;

function identityTarget(role?: string | null) {
  if (role === "CUSTOMER") return { href: "/dashboard", label: "My Orders", icon: ShoppingBag };
  if (role === "DELIVERY_PARTNER") return { href: "/delivery", label: "Assigned Orders", icon: Truck };
  if (role && role !== "INVALID") return { href: "/admin", label: "Staff Panel", icon: ShieldCheck };
  return { href: "/login", label: "Login", icon: UserRound };
}

export function SessionIdentityCard({
  user,
  compact = false,
  className = ""
}: {
  user: SessionIdentity;
  compact?: boolean;
  className?: string;
}) {
  const target = identityTarget(user?.role);
  const Icon = target.icon;
  const displayName = user?.name || user?.email || roleLabel(user?.role);

  if (!user?.id) {
    return (
      <Button asChild variant="outline" size="sm" className={`rounded-full px-3 ${className}`}>
        <Link href="/login" className="text-xs font-black">
          <UserRound className="h-4 w-4" />
          Login
        </Link>
      </Button>
    );
  }

  if (compact) {
    return (
      <div className={`flex items-center gap-1.5 ${className}`}>
        <Link
          href={target.href}
          title={`${target.label}: ${displayName}`}
          className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-border bg-background/80 text-primary"
        >
          <Icon className="h-4 w-4" />
          <span className="sr-only">{target.label}</span>
        </Link>
        <button
          type="button"
          title="Logout"
          onClick={() => signOut({ callbackUrl: "/" })}
          className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-border bg-background/80"
        >
          <LogOut className="h-4 w-4" />
          <span className="sr-only">Logout</span>
        </button>
      </div>
    );
  }

  return (
    <div className={`rounded-2xl border border-border bg-background/70 p-3 ${className}`}>
      <div className="flex min-w-0 items-center gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Icon className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-black">{displayName}</p>
          <p className="truncate text-xs font-bold text-primary">{roleLabel(user.role)}</p>
        </div>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <Link href={target.href} className="inline-flex h-9 items-center justify-center rounded-xl bg-primary px-3 text-xs font-black text-white">
          {target.label}
        </Link>
        <button
          type="button"
          onClick={() => signOut({ callbackUrl: "/" })}
          className="inline-flex h-9 items-center justify-center gap-1 rounded-xl border border-border bg-background px-3 text-xs font-black"
        >
          <LogOut className="h-3.5 w-3.5" />
          Logout
        </button>
      </div>
    </div>
  );
}
