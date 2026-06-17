"use client";

import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";

export function StaffSessionSwitch() {
  return (
    <button
      type="button"
      onClick={() => signOut({ callbackUrl: "/admin/login" })}
      className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-border bg-background px-4 text-sm font-black text-primary"
    >
      <LogOut className="h-4 w-4" />
      Sign out and continue as staff
    </button>
  );
}
