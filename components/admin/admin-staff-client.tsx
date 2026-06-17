"use client";

import { useState } from "react";
import { KeyRound, UserPlus, UserX } from "lucide-react";
import { readApiResponse } from "@/lib/client-api";
import { useToast } from "@/components/toast-provider";
import { roleLabel } from "@/lib/roles";

type StaffMember = {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  role: string;
  isActive: boolean;
  lastLoginAt: string | null;
  vehicleInfo: string | null;
};

export function AdminStaffClient({ staff }: { staff: StaffMember[] }) {
  const { showToast } = useToast();
  const [members, setMembers] = useState(staff);
  const [form, setForm] = useState({ name: "", email: "", phone: "", role: "MANAGER", password: "", vehicleInfo: "" });
  const designationOptions = [
    { value: "OWNER", label: "Owner", note: "Full store access" },
    { value: "MANAGER", label: "Manager", note: "Orders, products, customers, returns" },
    { value: "PACKING_STAFF", label: "Packing Staff", note: "Packing workflow and stock review" },
    { value: "DELIVERY_PARTNER", label: "Delivery Partner", note: "Assigned delivery orders only" },
    { value: "STAFF", label: "Staff", note: "General staff access" }
  ];

  async function addStaff(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const response = await fetch("/api/admin/staff", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form)
    });
    const data = await readApiResponse<{ error?: string; staff?: { id: string } }>(response);
    if (!response.ok || !data.staff) {
      showToast(data.error ?? "Staff create failed", "error");
      return;
    }
    setMembers((current) => [{ id: data.staff!.id, name: form.name, email: form.email, phone: form.phone, role: form.role, isActive: true, lastLoginAt: null, vehicleInfo: form.vehicleInfo }, ...current]);
    setForm({ name: "", email: "", phone: "", role: "MANAGER", password: "", vehicleInfo: "" });
    showToast("Staff account created", "success");
  }

  async function updateStaff(id: string, patch: { isActive?: boolean; password?: string }) {
    const response = await fetch(`/api/admin/staff/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch)
    });
    const data = await readApiResponse<{ error?: string }>(response);
    if (!response.ok) {
      showToast(data.error ?? "Staff update failed", "error");
      return;
    }
    if (patch.isActive !== undefined) setMembers((current) => current.map((member) => member.id === id ? { ...member, isActive: patch.isActive! } : member));
    showToast("Staff updated", "success");
  }

  return (
    <div>
      <div className="rounded-[2rem] bg-[linear-gradient(135deg,rgba(15,138,95,0.12),rgba(167,209,41,0.16))] p-5 sm:p-7">
        <p className="text-xs font-black uppercase text-primary">Owner controls</p>
        <h2 className="mt-2 font-display text-4xl font-black leading-tight">Staff</h2>
        <p className="mt-2 text-sm text-muted-foreground">Create staff accounts with clear designations and access boundaries.</p>
      </div>
      <form onSubmit={addStaff} className="mt-5 grid gap-3 rounded-[1.75rem] border border-white/70 bg-card/95 p-4 shadow-soft dark:border-white/10 sm:grid-cols-2">
        {(["name", "email", "phone", "password", "vehicleInfo"] as const).map((key) => (
          <input key={key} value={form[key]} onChange={(event) => setForm((current) => ({ ...current, [key]: event.target.value }))} placeholder={key} type={key === "password" ? "password" : key === "email" ? "email" : "text"} className="h-11 rounded-2xl border border-border bg-background px-4 text-sm font-bold outline-none focus:ring-2 focus:ring-primary" />
        ))}
        <label className="sm:col-span-2">
          <span className="text-sm font-bold">Designation</span>
          <select value={form.role} onChange={(event) => setForm((current) => ({ ...current, role: event.target.value }))} className="mt-2 h-11 w-full rounded-2xl border border-border bg-background px-4 text-sm font-bold outline-none focus:ring-2 focus:ring-primary">
            {designationOptions.map((option) => <option key={option.value} value={option.value}>{option.label} - {option.note}</option>)}
          </select>
        </label>
        <button className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-primary text-sm font-black text-white"><UserPlus className="h-4 w-4" />Add staff</button>
      </form>
      <div className="mt-5 grid gap-3">
        {members.map((member) => (
          <article key={member.id} className="rounded-[1.5rem] border border-white/70 bg-card/95 p-4 shadow-soft dark:border-white/10">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="font-black">{member.name ?? member.email ?? member.phone ?? "Staff member"}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{member.email} - {member.phone ?? "No phone"} - {roleLabel(member.role)}</p>
                <p className="mt-1 text-xs font-bold text-muted-foreground">Last login: {member.lastLoginAt ? new Date(member.lastLoginAt).toLocaleString("en-IN") : "Never"}</p>
              </div>
              <span className={member.isActive ? "rounded-full bg-primary/10 px-3 py-1 text-xs font-black text-primary" : "rounded-full bg-red-100 px-3 py-1 text-xs font-black text-red-700"}>{member.isActive ? "Active" : "Inactive"}</span>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <button onClick={() => updateStaff(member.id, { isActive: !member.isActive })} className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-border bg-background/70 text-xs font-black"><UserX className="h-4 w-4" />{member.isActive ? "Deactivate" : "Reactivate"}</button>
              <button onClick={() => {
                const password = window.prompt("Temporary password");
                if (password) updateStaff(member.id, { password });
              }} className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-primary text-xs font-black text-white"><KeyRound className="h-4 w-4" />Reset password</button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
