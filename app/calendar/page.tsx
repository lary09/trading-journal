"use client"

import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Plus,
  LogOut,
  User,
  Settings,
  TrendingUp,
  TrendingDown,
} from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"
import { TradingCalendar } from "@/components/trading-calendar"
import { TradeModal } from "@/components/trade-modal"

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

export default function CalendarPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [currentDate, setCurrentDate] = useState(new Date())
  const [calendarData, setCalendarData] = useState<Record<string, DayData>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [isTradeModalOpen, setIsTradeModalOpen] = useState(false)
  const [monthlyStats, setMonthlyStats] = useState({
    monthlyProfit: 0,
    annualProfit: 0,
    totalTrades: 0
  })

  useEffect(() => {
    const loadCalendar = async () => {
      try {
        const supabase = createClient()
        const { data: { user: authUser }, error: userError } = await supabase.auth.getUser()
        
        if (userError || !authUser) {
          router.push("/auth/login")
          return
        }

        setUser(authUser)

        // Fetch user profile
        const { data: userProfile } = await supabase.from("profiles").select("*").eq("id", authUser.id).single()
        setProfile(userProfile)

        // Fetch trades for current month
        await loadMonthData(authUser.id, currentDate)
      } catch (error) {
        console.error("Error loading calendar:", error)
        router.push("/auth/login")
      } finally {
        setIsLoading(false)
      }
    }

    loadCalendar()
  }, [router, currentDate])

  const loadMonthData = async (userId: string, date: Date) => {
    const supabase = createClient()
    
    const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1)
    const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0)
    
    const { data: trades } = await supabase
      .from("trades")
      .select("*")
      .eq("user_id", userId)
      .gte("entry_time", startOfMonth.toISOString())
      .lte("entry_time", endOfMonth.toISOString())
      .order("entry_time", { ascending: true })

    // Process trades into calendar data
    const calendarData: Record<string, DayData> = {}
    let monthlyProfit = 0
    
    if (trades) {
      trades.forEach((trade: Trade) => {
        const tradeDate = new Date(trade.entry_time).toISOString().split('T')[0]
        
        if (!calendarData[tradeDate]) {
          calendarData[tradeDate] = {
            date: tradeDate,
            profit_loss: 0,
            trade_count: 0,
            trades: []
          }
        }
        
        calendarData[tradeDate].trades.push(trade)
        calendarData[tradeDate].trade_count++
        
        if (trade.profit_loss) {
          calendarData[tradeDate].profit_loss += trade.profit_loss
          monthlyProfit += trade.profit_loss
        }
      })
    }
    
    setCalendarData(calendarData)
    setMonthlyStats(prev => ({ ...prev, monthlyProfit }))
  }

  const handleSignOut = async () => {
    try {
      const supabase = createClient()
      await supabase.auth.signOut()
      router.push("/")
    } catch (error) {
      console.error("Error signing out:", error)
    }
  }

  const handleDateClick = (dateString: string) => {
    setSelectedDate(dateString)
    setIsTradeModalOpen(true)
  }

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate)
    if (direction === 'prev') {
      newDate.setMonth(newDate.getMonth() - 1)
    } else {
      newDate.setMonth(newDate.getMonth() + 1)
    }
    setCurrentDate(newDate)
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(amount)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-white">Loading calendar...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="border-b border-slate-700 bg-slate-900/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.back()}
              className="text-slate-300 border-slate-600 hover:bg-slate-700"
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
            <div className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
              Trading Journal
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Badge variant="outline" className="border-blue-600 text-blue-400">
              Calendar
            </Badge>
            <div className="flex items-center gap-2 text-slate-300">
              <User className="h-4 w-4" />
              <span className="text-sm">{profile?.full_name || user.email}</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="border-slate-500 text-slate-200 hover:bg-slate-600 hover:text-white hover:border-slate-400 bg-slate-800/50 transition-all duration-200"
            >
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="border-slate-500 text-slate-200 hover:bg-slate-600 hover:text-white hover:border-slate-400 bg-slate-800/50 transition-all duration-200"
              onClick={handleSignOut}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Monthly Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="border-slate-700 bg-slate-800/50 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-300">Monthly Net Profit</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-400" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${monthlyStats.monthlyProfit >= 0 ? "text-green-400" : "text-red-400"}`}>
                {formatCurrency(monthlyStats.monthlyProfit)}
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-700 bg-slate-800/50 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-300">Annual Net Profit</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-400" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${monthlyStats.annualProfit >= 0 ? "text-green-400" : "text-red-400"}`}>
                {formatCurrency(monthlyStats.annualProfit)}
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-700 bg-slate-800/50 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-300">Monthly Trades</CardTitle>
              <CalendarIcon className="h-4 w-4 text-slate-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{monthlyStats.totalTrades}</div>
            </CardContent>
          </Card>
        </div>

        {/* Calendar Navigation */}
        <Card className="border-slate-700 bg-slate-800/50 backdrop-blur-sm mb-6">
          <CardHeader>
            <div className="flex items-center justify-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigateMonth('prev')}
                className="text-slate-300 hover:text-white hover:bg-slate-700"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <h2 className="text-xl font-semibold text-white mx-8">
                {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigateMonth('next')}
                className="text-slate-300 hover:text-white hover:bg-slate-700"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
        </Card>

        {/* Trading Calendar */}
        <TradingCalendar
          currentDate={currentDate}
          calendarData={calendarData}
          onDateClick={handleDateClick}
        />

        {/* Trade Modal */}
        <TradeModal
          isOpen={isTradeModalOpen}
          onClose={() => setIsTradeModalOpen(false)}
          selectedDate={selectedDate}
        />
      </div>
    </div>
  )
}
