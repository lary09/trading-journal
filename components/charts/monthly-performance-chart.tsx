"use client"

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

interface MonthlyData {
  month: string
  trades_count: number
  winning_trades: number
  win_rate: number
  monthly_pnl: number
}

interface MonthlyPerformanceChartProps {
  data: MonthlyData[]
}

const chartConfig = {
  pnl: {
    label: "Monthly P&L",
    color: "hsl(var(--chart-4))",
  },
}

export function MonthlyPerformanceChart({ data }: MonthlyPerformanceChartProps) {
  const chartData = data.map((item) => ({
    month: new Date(item.month).toLocaleDateString("en-US", { month: "short", year: "numeric" }),
    pnl: item.monthly_pnl,
    trades: item.trades_count,
    winRate: item.win_rate,
  }))

  if (chartData.length === 0) {
    return <div className="h-[300px] flex items-center justify-center text-slate-400">No monthly data to display</div>
  }

  return (
    <ChartContainer config={chartConfig} className="h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis
            dataKey="month"
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
            formatter={(value: number) => [`$${value.toFixed(2)}`, "Monthly P&L"]}
          />
          <Bar dataKey="pnl" fill="var(--color-pnl)" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartContainer>
  )
}
