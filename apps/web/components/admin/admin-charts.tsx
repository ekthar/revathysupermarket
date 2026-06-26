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
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="orders" fill="#0F8A5F" radius={[8, 8, 0, 0]} />
          <Bar dataKey="revenue" fill="#A7D129" radius={[8, 8, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
