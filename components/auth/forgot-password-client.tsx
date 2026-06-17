"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { readApiResponse } from "@/lib/client-api";

export function ForgotPasswordClient({ token: initialToken }: { token: string }) {
  const [email, setEmail] = useState("");
  const [token, setToken] = useState(initialToken);
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  async function requestReset(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const response = await fetch("/api/password/forgot", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email })
    });
    const data = await readApiResponse<{ resetUrl?: string }>(response);
    setMessage(data.resetUrl ? `Reset link generated for local testing: ${data.resetUrl}` : "If this account exists, a reset link will be sent.");
  }

  async function reset(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const response = await fetch("/api/password/reset", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password })
    });
    setMessage(response.ok ? "Password reset. You can log in now." : "Reset failed or token expired.");
  }

  return (
    <main className="mx-auto max-w-md px-4 py-16">
      <h1 className="text-center font-display text-4xl font-black">Forgot password</h1>
      <p className="mt-3 text-center text-muted-foreground">Request a reset link, then set a new password.</p>
      {!token ? (
        <form onSubmit={requestReset} className="mt-8 rounded-2xl border border-border bg-card p-6 shadow-soft">
          <Input type="email" placeholder="Email address" value={email} onChange={(event) => setEmail(event.target.value)} required />
          <Button className="mt-4 w-full">Request reset</Button>
        </form>
      ) : (
        <form onSubmit={reset} className="mt-8 grid gap-3 rounded-2xl border border-border bg-card p-6 shadow-soft">
          <Input value={token} onChange={(event) => setToken(event.target.value)} placeholder="Reset token" required />
          <Input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="New password" required />
          <Button>Reset password</Button>
        </form>
      )}
      {message ? <p className="mt-4 rounded-2xl bg-muted p-3 text-sm font-bold">{message}</p> : null}
    </main>
  );
}
