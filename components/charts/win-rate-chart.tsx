"use client"

import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

interface WinRateData {
  date: string
  pnl: number
  cumulative: number
  trade: number
}

interface WinRateChartProps {
  data: WinRateData[]
}

const chartConfig = {
  winRate: {
    label: "Win Rate",
    color: "hsl(var(--chart-2))",
  },
}

export function WinRateChart({ data }: WinRateChartProps) {
  if (data.length === 0) {
    return <div className="h-[300px] flex items-center justify-center text-slate-400">No closed trades to display</div>
  }

  // Calculate running win rate
  const winRateData = data.map((_, index) => {
    const tradesUpToNow = data.slice(0, index + 1)
    const wins = tradesUpToNow.filter((trade) => trade.pnl > 0).length
    const winRate = (wins / tradesUpToNow.length) * 100

    return {
      trade: index + 1,
      winRate: winRate,
    }
  })

  return (
    <ChartContainer config={chartConfig} className="h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={winRateData}>
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
            tickFormatter={(value) => `${value}%`}
            domain={[0, 100]}
          />
          <ChartTooltip
            content={<ChartTooltipContent />}
            formatter={(value: number) => [`${value.toFixed(1)}%`, "Win Rate"]}
            labelFormatter={(label) => `Trade #${label}`}
          />
          <Line
            type="monotone"
            dataKey="winRate"
            stroke="var(--color-winRate)"
            strokeWidth={2}
            dot={{ fill: "var(--color-winRate)", strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6, stroke: "var(--color-winRate)", strokeWidth: 2 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </ChartContainer>
  )
}
