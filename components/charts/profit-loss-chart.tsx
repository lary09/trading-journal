"use client"

import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

interface ProfitLossData {
  date: string
  pnl: number
  cumulative: number
  trade: number
}

interface ProfitLossChartProps {
  data: ProfitLossData[]
}

const chartConfig = {
  cumulative: {
    label: "Cumulative P&L",
    color: "hsl(var(--chart-1))",
  },
}

export function ProfitLossChart({ data }: ProfitLossChartProps) {
  if (data.length === 0) {
    return <div className="h-[300px] flex items-center justify-center text-slate-400">No closed trades to display</div>
  }

  return (
    <ChartContainer config={chartConfig} className="h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis
            dataKey="trade"
            stroke="hsl(var(--muted-foreground))"
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            stroke="hsl(var(--muted-foreground))"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => `$${value}`}
          />
          <ChartTooltip
            content={<ChartTooltipContent />}
            formatter={(value: number) => [`$${value.toFixed(2)}`, "Cumulative P&L"]}
            labelFormatter={(label) => `Trade #${label}`}
          />
          <Line
            type="monotone"
            dataKey="cumulative"
            stroke="var(--color-cumulative)"
            strokeWidth={2}
            dot={{ fill: "var(--color-cumulative)", strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6, stroke: "var(--color-cumulative)", strokeWidth: 2 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </ChartContainer>
  )
}
