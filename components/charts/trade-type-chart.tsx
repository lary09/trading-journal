"use client"

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

interface TradeTypeChartProps {
  data: Record<string, number>
}

const chartConfig = {
  count: {
    label: "Trades",
    color: "hsl(var(--chart-3))",
  },
}

export function TradeTypeChart({ data }: TradeTypeChartProps) {
  const chartData = Object.entries(data).map(([type, count]) => ({
    type: type.charAt(0).toUpperCase() + type.slice(1),
    count: count,
  }))

  if (chartData.length === 0) {
    return <div className="h-[300px] flex items-center justify-center text-slate-400">No data to display</div>
  }

  return (
    <ChartContainer config={chartConfig} className="h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis dataKey="type" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
          <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
          <ChartTooltip content={<ChartTooltipContent />} formatter={(value: number) => [value, "Trades"]} />
          <Bar dataKey="count" fill="var(--color-count)" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartContainer>
  )
}
