"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { formatCurrency } from "@/lib/utils";

interface RevenueChartProps {
  data: { month: string; revenue: number; orders: number }[];
}

export function RevenueChart({ data }: RevenueChartProps) {
  if (data.length === 0) return null;

  return (
    <div className="h-[220px] sm:h-[260px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 5, right: 5, left: -10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
          <XAxis
            dataKey="month"
            tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(value) => value >= 1000 ? `${(value / 1000).toFixed(0)}k` : value}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "hsl(var(--card))",
              border: "1px solid hsl(var(--border))",
              borderRadius: "0.75rem",
              padding: "8px 12px",
              fontSize: "12px",
              boxShadow: "0 4px 12px rgba(0,0,0,0.1)"
            }}
            labelStyle={{ fontWeight: 700, marginBottom: 4, color: "hsl(var(--foreground))" }}
            formatter={(value: number, name: string) => [
              name === "revenue" ? formatCurrency(value) : value,
              name === "revenue" ? "Revenue" : "Orders"
            ]}
          />
          <Bar
            dataKey="revenue"
            fill="#0F8A5F"
            radius={[4, 4, 0, 0]}
            maxBarSize={40}
          />
          <Bar
            dataKey="orders"
            fill="hsl(var(--muted-foreground))"
            opacity={0.3}
            radius={[4, 4, 0, 0]}
            maxBarSize={40}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
