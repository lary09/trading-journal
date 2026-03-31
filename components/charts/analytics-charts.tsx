"use client"

import React from "react"
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"

interface BarChartData {
  name: string
  pnl: number
}

interface AnalyticsChartsProps {
  data: BarChartData[]
  title: string
  color?: string
}

export function PerformanceBarChart({ data, title, color = "#3b82f6" }: AnalyticsChartsProps) {
  return (
    <div className="w-full h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 20, right: 30, left: 10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
          <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
          <YAxis 
            stroke="#64748b" 
            fontSize={12} 
            tickLine={false} 
            axisLine={false} 
            tickFormatter={(value) => `$${value}`}
          />
          <Tooltip
            cursor={{ fill: "#1e293b", opacity: 0.4 }}
            content={({ active, payload, label }) => {
              if (active && payload && payload.length) {
                const val = payload[0].value as number
                const isPositive = val >= 0
                return (
                  <div className="bg-slate-900 border border-slate-700/50 p-3 rounded-md shadow-xl text-xs">
                    <p className="font-semibold text-slate-300 mb-1">{label}</p>
                    <p className={`font-medium ${isPositive ? "text-emerald-400" : "text-rose-400"}`}>
                      {isPositive ? "+" : ""}${val.toFixed(2)}
                    </p>
                  </div>
                )
              }
              return null
            }}
          />
          <Bar dataKey="pnl" fill={color} radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
