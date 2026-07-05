"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export function AdminCharts({
  data
}: {
  data: Array<{ name: string; orders: number; revenue: number }>;
}) {
  return (
    <div className="h-72 rounded-2xl border border-border bg-card p-4 shadow-soft">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
          <XAxis dataKey="name" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
          <Tooltip
            contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "0.75rem", padding: "8px 12px", fontSize: "12px", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}
            labelStyle={{ fontWeight: 700, marginBottom: 4, color: "hsl(var(--foreground))" }}
          />
          <Bar dataKey="orders" fill="#0F8A5F" radius={[8, 8, 0, 0]} />
          <Bar dataKey="revenue" fill="#A7D129" radius={[8, 8, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
