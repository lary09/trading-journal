"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from "recharts"
import { TrendingUp, TrendingDown, DollarSign, Target } from "lucide-react"

interface PerformanceData {
  date: string
  pnl: number
  cumulative: number
  trades: number
}

interface PerformanceChartProps {
  data: PerformanceData[]
  className?: string
}

export function PerformanceChart({ data, className }: PerformanceChartProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    })
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-800 border border-slate-600 rounded-lg p-3 shadow-lg">
          <p className="text-slate-300 font-medium">{formatDate(label)}</p>
          <p className="text-green-400">
            P&L: {formatCurrency(payload[0].value)}
          </p>
          <p className="text-blue-400">
            Cumulative: {formatCurrency(payload[1].value)}
          </p>
          <p className="text-slate-400">
            Trades: {payload[2]?.value || 0}
          </p>
        </div>
      )
    }
    return null
  }

  const totalPnL = data.reduce((sum, item) => sum + item.pnl, 0)
  const isPositive = totalPnL >= 0

  return (
    <Card className={`border-slate-700 bg-slate-800/50 backdrop-blur-sm ${className}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-white flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-400" />
              Performance Overview
            </CardTitle>
            <CardDescription className="text-slate-400">
              Your trading performance over time
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <div className={`flex items-center gap-1 px-2 py-1 rounded text-sm ${
              isPositive ? 'bg-green-900/20 text-green-400' : 'bg-red-900/20 text-red-400'
            }`}>
              {isPositive ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
              <span className="font-medium">{formatCurrency(totalPnL)}</span>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <defs>
                <linearGradient id="colorPnl" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorCumulative" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis 
                dataKey="date" 
                tickFormatter={formatDate}
                stroke="#9ca3af"
                fontSize={12}
              />
              <YAxis 
                tickFormatter={formatCurrency}
                stroke="#9ca3af"
                fontSize={12}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="pnl"
                stroke="#10b981"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorPnl)"
                name="Daily P&L"
              />
              <Area
                type="monotone"
                dataKey="cumulative"
                stroke="#3b82f6"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorCumulative)"
                name="Cumulative P&L"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        
        {/* Performance Metrics */}
        <div className="grid grid-cols-3 gap-4 mt-6">
          <div className="text-center p-3 bg-slate-700/50 rounded-lg">
            <div className="text-2xl font-bold text-white">
              {data.length > 0 ? data[data.length - 1].cumulative : 0}
            </div>
            <div className="text-sm text-slate-400">Total P&L</div>
          </div>
          <div className="text-center p-3 bg-slate-700/50 rounded-lg">
            <div className="text-2xl font-bold text-white">
              {data.reduce((sum, item) => sum + item.trades, 0)}
            </div>
            <div className="text-sm text-slate-400">Total Trades</div>
          </div>
          <div className="text-center p-3 bg-slate-700/50 rounded-lg">
            <div className="text-2xl font-bold text-white">
              {data.length > 0 ? (data[data.length - 1].cumulative / data.reduce((sum, item) => sum + item.trades, 0)).toFixed(2) : 0}
            </div>
            <div className="text-sm text-slate-400">Avg per Trade</div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
