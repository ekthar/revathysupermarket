"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { readApiResponse } from "@/lib/client-api";

export function RegisterForm() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "" });
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    const response = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form)
    });
    const data = await readApiResponse<{ error?: string }>(response);
    setLoading(false);
    if (!response.ok) {
      setMessage(data.error ?? "Registration failed.");
      return;
    }
    router.push("/login");
  }

  return (
    <form onSubmit={submit} className="mx-auto mt-8 max-w-md rounded-2xl border border-border bg-card p-6 shadow-soft">
      {[
        ["name", "Name", "text"],
        ["email", "Email", "email"],
        ["phone", "Phone", "tel"],
        ["password", "Password", "password"]
      ].map(([name, label, type]) => (
        <label key={name} className="mt-4 block first:mt-0">
          <span className="text-sm font-bold">{label}</span>
          <Input
            type={type}
            value={form[name as keyof typeof form]}
            onChange={(event) => setForm((current) => ({ ...current, [name]: event.target.value }))}
            required
            className="mt-2"
          />
        </label>
      ))}
      {message && <p className="mt-4 rounded-xl bg-muted p-3 text-sm font-medium">{message}</p>}
      <Button className="mt-5 w-full" size="lg" disabled={loading}>
        {loading ? "Creating account" : "Register"}
      </Button>
    </form>
  );
}
