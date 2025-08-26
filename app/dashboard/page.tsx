"use client"

import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Target,
  Calendar,
  Plus,
  BarChart3,
  Settings,
  LogOut,
  User,
  Download,
  Calculator,
} from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"
import { PerformanceChart } from "@/components/charts/performance-chart"

interface Trade {
  id: string
  symbol: string
  trade_type: string
  entry_price: number
  exit_price: number | null
  profit_loss: number | null
  status: string
  entry_time: string
  market_type: string
}

interface PerformanceData {
  total_trades: number
  winning_trades: number
  losing_trades: number
  win_rate_percentage: number
  total_profit_loss: number
  average_profit_loss: number
  best_trade: number
  worst_trade: number
}

export default function DashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [performanceData, setPerformanceData] = useState<PerformanceData>({
    total_trades: 0,
    winning_trades: 0,
    losing_trades: 0,
    win_rate_percentage: 0,
    total_profit_loss: 0,
    average_profit_loss: 0,
    best_trade: 0,
    worst_trade: 0,
  })
  const [recentTrades, setRecentTrades] = useState<Trade[]>([])
  const [performanceChartData, setPerformanceChartData] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadDashboard = async () => {
      // Check if we're in test mode
      const isTestMode = process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('placeholder') || 
                        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.includes('placeholder')

      if (isTestMode) {
        console.log("[v0] Dashboard running in test mode - using mock data")
        setUser({ id: "test-user", email: "test@example.com" })
        setProfile({ full_name: "Test User", trading_experience: "intermediate" })
        setPerformanceData({
          total_trades: 25,
          winning_trades: 18,
          losing_trades: 7,
          win_rate_percentage: 72,
          total_profit_loss: 1250.50,
          average_profit_loss: 50.02,
          best_trade: 350.00,
          worst_trade: -120.00,
        })
        // Mock performance chart data
        const mockChartData = [
          { date: "2024-01-01", pnl: 150, cumulative: 150, trades: 3 },
          { date: "2024-01-02", pnl: -50, cumulative: 100, trades: 2 },
          { date: "2024-01-03", pnl: 200, cumulative: 300, trades: 4 },
          { date: "2024-01-04", pnl: 75, cumulative: 375, trades: 2 },
          { date: "2024-01-05", pnl: -25, cumulative: 350, trades: 1 },
          { date: "2024-01-06", pnl: 300, cumulative: 650, trades: 3 },
          { date: "2024-01-07", pnl: 125, cumulative: 775, trades: 2 },
          { date: "2024-01-08", pnl: -100, cumulative: 675, trades: 2 },
          { date: "2024-01-09", pnl: 250, cumulative: 925, trades: 3 },
          { date: "2024-01-10", pnl: 325, cumulative: 1250, trades: 4 },
        ]
        setPerformanceChartData(mockChartData)

        setRecentTrades([
          {
            id: "1",
            symbol: "AAPL",
            trade_type: "long",
            market_type: "stock",
            entry_price: 150.25,
            exit_price: 155.75,
            profit_loss: 275.00,
            entry_time: "2024-01-15T10:30:00Z",
            status: "closed",
          },
          {
            id: "2",
            symbol: "TSLA",
            trade_type: "short",
            market_type: "stock",
            entry_price: 240.00,
            exit_price: 235.50,
            profit_loss: 225.00,
            entry_time: "2024-01-14T09:15:00Z",
            status: "closed",
          }
        ])
        setIsLoading(false)
        return
      }

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

        // Fetch performance data
        const { data: performance } = await supabase
          .from("user_performance_summary")
          .select("*")
          .eq("user_id", authUser.id)
          .single()

        if (performance) {
          setPerformanceData(performance)
        }

        // Fetch recent trades
        const { data: trades } = await supabase
          .from("trades")
          .select("*")
          .eq("user_id", authUser.id)
          .order("entry_time", { ascending: false })
          .limit(5)

        setRecentTrades(trades || [])
      } catch (error) {
        console.error("Error loading dashboard:", error)
        router.push("/auth/login")
      } finally {
        setIsLoading(false)
      }
    }

    loadDashboard()
  }, [router])

  const handleSignOut = async () => {
    const isTestMode = process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('placeholder') || 
                      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.includes('placeholder')

    if (isTestMode) {
      console.log("[v0] Test mode - simulating signout")
      router.push("/")
      return
    }
    
    try {
      const supabase = createClient()
      await supabase.auth.signOut()
      router.push("/")
    } catch (error) {
      console.error("Error signing out:", error)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-white">Loading dashboard...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="border-b border-slate-700 bg-slate-800/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-bold text-white">Trading Journal</h1>
              <Badge variant="outline" className="border-blue-600 text-blue-400">
                Dashboard
              </Badge>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-slate-300">
                <User className="h-4 w-4" />
                <span className="text-sm">{profile?.full_name || user.email}</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="border-slate-600 text-slate-300 hover:bg-slate-700 bg-transparent"
              >
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="border-slate-600 text-slate-300 hover:bg-slate-700 bg-transparent"
                onClick={handleSignOut}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Quick Actions */}
        <div className="flex gap-4 mb-8">
          <Button asChild className="bg-blue-600 hover:bg-blue-700">
            <Link href="/trades/new">
              <Plus className="h-4 w-4 mr-2" />
              New Trade
            </Link>
          </Button>
          <Button
            variant="outline"
            asChild
            className="border-slate-600 text-slate-300 hover:bg-slate-700 bg-transparent"
          >
            <Link href="/analytics">
              <BarChart3 className="h-4 w-4 mr-2" />
              Analytics
            </Link>
          </Button>
          <Button
            variant="outline"
            asChild
            className="border-slate-600 text-slate-300 hover:bg-slate-700 bg-transparent"
          >
            <Link href="/export">
              <Download className="h-4 w-4 mr-2" />
              Export Data
            </Link>
          </Button>
          <Button
            variant="outline"
            asChild
            className="border-slate-600 text-slate-300 hover:bg-slate-700 bg-transparent"
          >
            <Link href="/strategies">
              <Target className="h-4 w-4 mr-2" />
              Strategies
            </Link>
          </Button>
          <Button
            variant="outline"
            asChild
            className="border-slate-600 text-slate-300 hover:bg-slate-700 bg-transparent"
          >
            <Link href="/options-analysis">
              <Calculator className="h-4 w-4 mr-2" />
              Options Analysis
            </Link>
          </Button>
        </div>

        {/* Performance Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="border-slate-700 bg-slate-800/50 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-300">Total P&L</CardTitle>
              <DollarSign className="h-4 w-4 text-slate-400" />
            </CardHeader>
            <CardContent>
              <div
                className={`text-2xl font-bold ${performanceData.total_profit_loss >= 0 ? "text-green-400" : "text-red-400"}`}
              >
                ${performanceData.total_profit_loss.toFixed(2)}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Avg: ${performanceData.average_profit_loss.toFixed(2)} per trade
              </p>
            </CardContent>
          </Card>

          <Card className="border-slate-700 bg-slate-800/50 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-300">Win Rate</CardTitle>
              <Target className="h-4 w-4 text-slate-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{performanceData.win_rate_percentage.toFixed(1)}%</div>
              <Progress value={performanceData.win_rate_percentage} className="mt-2 h-2" />
              <p className="text-xs text-slate-500 mt-1">
                {performanceData.winning_trades}W / {performanceData.losing_trades}L
              </p>
            </CardContent>
          </Card>

          <Card className="border-slate-700 bg-slate-800/50 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-300">Best Trade</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-400">${performanceData.best_trade.toFixed(2)}</div>
              <p className="text-xs text-slate-500 mt-1">Highest single trade profit</p>
            </CardContent>
          </Card>

          <Card className="border-slate-700 bg-slate-800/50 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-300">Total Trades</CardTitle>
              <Calendar className="h-4 w-4 text-slate-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{performanceData.total_trades}</div>
              <p className="text-xs text-slate-500 mt-1">Trades executed</p>
            </CardContent>
          </Card>
        </div>

        {/* Performance Chart */}
        <div className="mb-8">
          <PerformanceChart data={performanceChartData} />
        </div>

        {/* Recent Trades */}
        <Card className="border-slate-700 bg-slate-800/50 backdrop-blur-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-white">Recent Trades</CardTitle>
                <CardDescription className="text-slate-400">Your latest trading activity</CardDescription>
              </div>
              <Button
                variant="outline"
                asChild
                size="sm"
                className="border-slate-600 text-slate-300 hover:bg-slate-700 bg-transparent"
              >
                <Link href="/trades">View All</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {recentTrades && recentTrades.length > 0 ? (
              <div className="space-y-4">
                {recentTrades.map((trade: Trade) => (
                  <div
                    key={trade.id}
                    className="flex items-center justify-between p-4 rounded-lg bg-slate-700/50 border border-slate-600"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-white">{trade.symbol}</span>
                          <Badge
                            variant={
                              trade.trade_type === "buy" || trade.trade_type === "long" ? "default" : "secondary"
                            }
                            className="text-xs"
                          >
                            {(trade.trade_type || "UNKNOWN").toUpperCase()}
                          </Badge>
                          <Badge variant="outline" className="text-xs border-slate-500 text-slate-400">
                            {trade.market_type || "Unknown"}
                          </Badge>
                        </div>
                        <div className="text-sm text-slate-400">
                          Entry: ${trade.entry_price.toFixed(4)} • {new Date(trade.entry_time).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <Badge
                        variant={
                          trade.status === "open" ? "default" : trade.status === "closed" ? "secondary" : "destructive"
                        }
                        className="capitalize"
                      >
                        {trade.status}
                      </Badge>
                      {trade.profit_loss !== null && (
                        <div
                          className={`flex items-center gap-1 ${trade.profit_loss >= 0 ? "text-green-400" : "text-red-400"}`}
                        >
                          {trade.profit_loss >= 0 ? (
                            <TrendingUp className="h-4 w-4" />
                          ) : (
                            <TrendingDown className="h-4 w-4" />
                          )}
                          <span className="font-medium">${Math.abs(trade.profit_loss).toFixed(2)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="text-slate-400 mb-4">No trades recorded yet</div>
                <Button asChild className="bg-blue-600 hover:bg-blue-700">
                  <Link href="/trades/new">
                    <Plus className="h-4 w-4 mr-2" />
                    Record Your First Trade
                  </Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Stats */}
        {performanceData.total_trades > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
            <Card className="border-slate-700 bg-slate-800/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-sm text-slate-300">Risk Management</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Best Trade:</span>
                    <span className="text-green-400">${performanceData.best_trade.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Worst Trade:</span>
                    <span className="text-red-400">${Math.abs(performanceData.worst_trade).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Risk/Reward:</span>
                    <span className="text-white">
                      {performanceData.worst_trade !== 0
                        ? (performanceData.best_trade / Math.abs(performanceData.worst_trade)).toFixed(2)
                        : "N/A"}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-slate-700 bg-slate-800/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-sm text-slate-300">Trading Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Winning Trades:</span>
                    <span className="text-green-400">{performanceData.winning_trades}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Losing Trades:</span>
                    <span className="text-red-400">{performanceData.losing_trades}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Total Trades:</span>
                    <span className="text-white">{performanceData.total_trades}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-slate-700 bg-slate-800/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-sm text-slate-300">Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Total P&L:</span>
                    <span className={performanceData.total_profit_loss >= 0 ? "text-green-400" : "text-red-400"}>
                      ${performanceData.total_profit_loss.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Avg per Trade:</span>
                    <span className={performanceData.average_profit_loss >= 0 ? "text-green-400" : "text-red-400"}>
                      ${performanceData.average_profit_loss.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Win Rate:</span>
                    <span className="text-white">{performanceData.win_rate_percentage.toFixed(1)}%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
