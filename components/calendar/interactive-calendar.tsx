"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight, TrendingDown, TrendingUp, BarChart3, Calendar as CalendarIcon } from "lucide-react"
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { NormalizedTrade } from "@/lib/data/trades"

interface InteractiveCalendarProps {
  trades: NormalizedTrade[]
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value)
}

export function InteractiveCalendar({ trades }: InteractiveCalendarProps) {
  const [currentDate, setCurrentDate] = React.useState(new Date())

  // Create a map of YYYY-MM-DD -> trades
  const tradesByDay = React.useMemo(() => {
    const map = new Map<string, NormalizedTrade[]>()
    for (const t of trades) {
      if (!t.entryTime) continue
      const dateStr = format(new Date(t.entryTime), "yyyy-MM-dd")
      if (!map.has(dateStr)) map.set(dateStr, [])
      map.get(dateStr)!.push(t)
    }
    return map
  }, [trades])

  // Calendar math
  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(monthStart)
  const startDate = startOfWeek(monthStart, { weekStartsOn: 1 }) // Monday start
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 })

  const dateFormat = "d"
  const days = eachDayOfInterval({ start: startDate, end: endDate })

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1))
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1))
  const jumpToToday = () => setCurrentDate(new Date())

  // Month stats
  const monthTrades = trades.filter((t) => {
    if (!t.entryTime) return false
    return isSameMonth(new Date(t.entryTime), currentDate)
  })

  let totalMonthPnL = 0
  let totalWinners = 0
  monthTrades.forEach((t) => {
    totalMonthPnL += t.profitLoss ?? 0
    if ((t.profitLoss ?? 0) > 0) totalWinners++
  })

  const winRate = monthTrades.length > 0 ? (totalWinners / monthTrades.length) * 100 : 0

  return (
    <div className="space-y-6">
      {/* Metrics Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-slate-900/60 border-slate-800 backdrop-blur-md">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">Monthly P&L</CardTitle>
            {totalMonthPnL >= 0 ? <TrendingUp className="h-4 w-4 text-emerald-400" /> : <TrendingDown className="h-4 w-4 text-rose-400" />}
          </CardHeader>
          <CardContent>
            <div className={cn("text-2xl font-bold", totalMonthPnL >= 0 ? "text-emerald-400" : "text-rose-400")}>
              {formatCurrency(totalMonthPnL)}
            </div>
            <p className="text-xs text-slate-500 mt-1">For {format(currentDate, "MMMM yyyy")}</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/60 border-slate-800 backdrop-blur-md">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">Total Trades</CardTitle>
            <BarChart3 className="h-4 w-4 text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-200">{monthTrades.length}</div>
            <p className="text-xs text-slate-500 mt-1">Executions</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/60 border-slate-800 backdrop-blur-md">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">Win Rate</CardTitle>
            <CalendarIcon className="h-4 w-4 text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-200">{winRate.toFixed(1)}%</div>
            <p className="text-xs text-slate-500 mt-1">{totalWinners} winning trades</p>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-slate-950/80 border-slate-800 shadow-xl ring-1 ring-white/5 mx-auto">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 px-6 py-4 border-b border-slate-800">
          <div className="flex items-center gap-4">
            <h2 className="text-2xl font-bold tracking-tight text-white">{format(currentDate, "MMMM yyyy")}</h2>
            <Button variant="outline" size="sm" onClick={jumpToToday} className="hidden sm:inline-flex bg-slate-900/50 border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800">
              Today
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={prevMonth} className="bg-slate-900/50 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={nextMonth} className="bg-slate-900/50 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="grid grid-cols-7 border-b border-slate-800 bg-slate-900/30">
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
              <div key={day} className="py-3 text-center text-xs font-semibold text-slate-500 tracking-wider">
                {day}
              </div>
            ))}
          </div>
          
          <div className="grid grid-cols-7">
            {days.map((day, dayIdx) => {
              const dateStr = format(day, "yyyy-MM-dd")
              const dayTrades = tradesByDay.get(dateStr) || []
              let dailyPnL = 0
              dayTrades.forEach((t) => (dailyPnL += t.profitLoss ?? 0))

              const isCurrentMonth = isSameMonth(day, currentDate)
              const isTodayDate = isToday(day)

              let boxStyles = "bg-transparent text-slate-400 hover:bg-slate-800/40"
              let pnlColor = "text-slate-500"

              if (dayTrades.length > 0) {
                if (dailyPnL > 0) {
                  boxStyles = "bg-emerald-500/10 hover:bg-emerald-500/20 shadow-[inset_0_0_20px_rgba(16,185,129,0.05)] ring-1 ring-inset ring-emerald-500/20 text-emerald-100"
                  pnlColor = "text-emerald-400 font-bold"
                } else if (dailyPnL < 0) {
                  boxStyles = "bg-rose-500/10 hover:bg-rose-500/20 shadow-[inset_0_0_20px_rgba(244,63,94,0.05)] ring-1 ring-inset ring-rose-500/20 text-rose-100"
                  pnlColor = "text-rose-400 font-bold"
                } else {
                  boxStyles = "bg-blue-500/10 hover:bg-blue-500/20 ring-1 ring-inset ring-blue-500/20 text-blue-100"
                  pnlColor = "text-blue-400 font-bold"
                }
              }

              return (
                <div
                  key={day.toString()}
                  className={cn(
                    "min-h-[100px] border-b border-r border-slate-800 p-2 transition-colors relative group",
                    !isCurrentMonth && "opacity-40",
                    isCurrentMonth && "bg-slate-900/20",
                    boxStyles,
                    dayIdx % 7 === 6 && "border-r-0"
                  )}
                >
                  <div className="flex justify-between items-start">
                    <span
                      className={cn(
                        "text-sm font-medium w-8 h-8 flex items-center justify-center rounded-full transition-all",
                        isTodayDate ? "bg-indigo-500 text-white shadow-[0_0_15px_rgba(99,102,241,0.5)]" : ""
                      )}
                    >
                      {format(day, dateFormat)}
                    </span>
                    {dayTrades.length > 0 && (
                      <span className="text-[10px] text-slate-500 bg-slate-900/80 px-1.5 py-0.5 rounded-full border border-slate-700/50">
                        {dayTrades.length} trades
                      </span>
                    )}
                  </div>
                  
                  {dayTrades.length > 0 && (
                    <div className="mt-3 text-right">
                      <div className={cn("text-lg", pnlColor)}>
                        {dailyPnL > 0 ? "+" : ""}{formatCurrency(dailyPnL)}
                      </div>
                    </div>
                  )}

                  {/* Tooltip on hover for extra info */}
                  {dayTrades.length > 0 && (
                    <div className="absolute inset-0 z-10 hidden group-hover:flex flex-col items-center justify-center bg-slate-950/90 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity p-2 text-center overflow-hidden">
                       <p className="text-xs font-semibold text-slate-300 mb-1">Trades</p>
                       <div className="flex flex-wrap gap-1 justify-center max-h-12 overflow-hidden">
                        {dayTrades.slice(0, 3).map(t => (
                          <span key={t.id} className="text-[10px] bg-slate-800 text-slate-300 px-1 rounded border border-slate-700">{t.symbol}</span>
                        ))}
                        {dayTrades.length > 3 && <span className="text-[10px] text-slate-500">+{dayTrades.length - 3}</span>}
                       </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
