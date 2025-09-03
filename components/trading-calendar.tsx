"use client"

import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface Trade {
  id: string
  symbol: string
  trade_type: string
  entry_price: number
  exit_price: number | null
  profit_loss: number | null
  status: string
  entry_time: string
  exit_time: string | null
  market_type: string
}

interface DayData {
  date: string
  profit_loss: number
  trade_count: number
  trades: Trade[]
}

interface TradingCalendarProps {
  currentDate: Date
  calendarData: Record<string, DayData>
  onDateClick: (dateString: string) => void
}

export function TradingCalendar({ 
  currentDate, 
  calendarData, 
  onDateClick 
}: TradingCalendarProps) {
  const today = new Date()
  const todayString = today.toISOString().split('T')[0]
  
  // Get first day of the month and number of days
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
  const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)
  const daysInMonth = lastDayOfMonth.getDate()
  const startingDayOfWeek = firstDayOfMonth.getDay() // 0 = Sunday
  
  // Get days from previous month to fill the grid
  const prevMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 0)
  const daysInPrevMonth = prevMonth.getDate()
  
  // Get days for next month
  const nextMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1)
  
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(amount)
  }
  
  const formatTradeCount = (count: number) => {
    return count === 1 ? '1 trade' : `${count} trades`
  }
  
  const getDayColor = (profit_loss: number) => {
    if (profit_loss > 0) {
      return {
        bg: 'bg-green-900/30 border-green-600/50',
        text: 'text-green-400',
        hover: 'hover:bg-green-900/50'
      }
    } else if (profit_loss < 0) {
      return {
        bg: 'bg-red-900/30 border-red-600/50',
        text: 'text-red-400',
        hover: 'hover:bg-red-900/50'
      }
    }
    return {
      bg: 'bg-slate-800/50 border-slate-700',
      text: 'text-slate-300',
      hover: 'hover:bg-slate-700/50'
    }
  }
  
  const renderCalendarDay = (dayNumber: number, monthOffset: number = 0) => {
    let dateObj: Date
    let isCurrentMonth = true
    
    if (monthOffset === -1) {
      // Previous month
      dateObj = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, dayNumber)
      isCurrentMonth = false
    } else if (monthOffset === 1) {
      // Next month
      dateObj = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, dayNumber)
      isCurrentMonth = false
    } else {
      // Current month
      dateObj = new Date(currentDate.getFullYear(), currentDate.getMonth(), dayNumber)
    }
    
    const dateString = dateObj.toISOString().split('T')[0]
    const dayData = calendarData[dateString]
    const isToday = dateString === todayString
    const hasData = dayData && dayData.trade_count > 0
    
    const colors = hasData ? getDayColor(dayData.profit_loss) : getDayColor(0)
    
    return (
      <div
        key={`${monthOffset}-${dayNumber}`}
        onClick={() => onDateClick(dateString)}
        className={cn(
          "relative p-2 h-20 border cursor-pointer transition-all duration-200",
          colors.bg,
          colors.hover,
          "hover:border-slate-500",
          !isCurrentMonth && "opacity-40",
          isToday && "ring-2 ring-blue-400 ring-offset-2 ring-offset-slate-900"
        )}
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between mb-1">
            <span className={cn(
              "text-sm font-medium",
              isCurrentMonth ? "text-white" : "text-slate-500"
            )}>
              {dayNumber}
            </span>
            {isToday && (
              <div className="w-2 h-2 bg-blue-400 rounded-full" />
            )}
          </div>
          
          {hasData && (
            <div className="flex-1 flex flex-col justify-center items-center text-center">
              <div className={cn("text-xs font-semibold", colors.text)}>
                {formatCurrency(dayData.profit_loss)}
              </div>
              <div className="text-xs text-slate-400 mt-1">
                {formatTradeCount(dayData.trade_count)}
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }
  
  const renderWeek = (startDay: number, monthOffset: number = 0) => {
    const week = []
    for (let i = 0; i < 7; i++) {
      week.push(renderCalendarDay(startDay + i, monthOffset))
    }
    return week
  }
  
  const calendarDays = []
  
  // Add days from previous month
  for (let i = startingDayOfWeek - 1; i >= 0; i--) {
    const dayNumber = daysInPrevMonth - i
    calendarDays.push(renderCalendarDay(dayNumber, -1))
  }
  
  // Add days from current month
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(renderCalendarDay(day, 0))
  }
  
  // Add days from next month to complete the grid
  const totalCells = calendarDays.length
  const remainingCells = 42 - totalCells // 6 weeks * 7 days
  for (let day = 1; day <= remainingCells; day++) {
    calendarDays.push(renderCalendarDay(day, 1))
  }
  
  return (
    <Card className="border-slate-700 bg-slate-800/50 backdrop-blur-sm h-full flex flex-col">
      <CardContent className="p-6 flex-1 flex flex-col">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-white mb-4">Profit & Loss Calendar</h3>
        </div>
        
        {/* Day headers */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {dayNames.map((day) => (
            <div
              key={day}
              className="p-2 text-center text-sm font-medium text-slate-400 border-b border-slate-700"
            >
              {day}
            </div>
          ))}
        </div>
        
        {/* Calendar grid with scrollable content */}
        <div className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-7 gap-1 min-h-[400px]">
            {calendarDays}
          </div>
        </div>
        
        {/* Legend */}
        <div className="flex items-center justify-center gap-6 mt-6 pt-4 border-t border-slate-700">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-900/30 border border-green-600/50 rounded"></div>
            <span className="text-xs text-slate-400">Profitable Day</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-900/30 border border-red-600/50 rounded"></div>
            <span className="text-xs text-slate-400">Loss Day</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-slate-800/50 border border-slate-700 rounded"></div>
            <span className="text-xs text-slate-400">No Trades</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-400 rounded-full"></div>
            <span className="text-xs text-slate-400">Today</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
