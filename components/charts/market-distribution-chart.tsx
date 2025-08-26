"use client"

import { PieChart, Pie, Cell, ResponsiveContainer, Legend } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

interface MarketDistributionChartProps {
  data: Record<string, number>
}

const COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
]

const chartConfig = {
  trades: {
    label: "Trades",
  },
}

export function MarketDistributionChart({ data }: MarketDistributionChartProps) {
  const chartData = Object.entries(data).map(([market, count]) => ({
    name: market.charAt(0).toUpperCase() + market.slice(1),
    value: count,
  }))

  if (chartData.length === 0) {
    return <div className="h-[300px] flex items-center justify-center text-slate-400">No data to display</div>
  }

  return (
    <ChartContainer config={chartConfig} className="h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={chartData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value">
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <ChartTooltip content={<ChartTooltipContent />} formatter={(value: number) => [value, "Trades"]} />
          <Legend
            verticalAlign="bottom"
            height={36}
            formatter={(value) => <span className="text-slate-300">{value}</span>}
          />
        </PieChart>
      </ResponsiveContainer>
    </ChartContainer>
  )
}
