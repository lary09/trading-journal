"use client"

import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, TrendingUp, BarChart3, PieChart } from "lucide-react"
import Link from "next/link"
import { ProfitLossChart } from "@/components/charts/profit-loss-chart"
import { WinRateChart } from "@/components/charts/win-rate-chart"
import { MarketDistributionChart } from "@/components/charts/market-distribution-chart"
import { MonthlyPerformanceChart } from "@/components/charts/monthly-performance-chart"
import { TradeTypeChart } from "@/components/charts/trade-type-chart"
import { useEffect, useState } from "react"

interface Trade {
  id: string
  symbol: string
  trade_type: string
  market_type: string
  profit_loss: number | null
  profit_loss_percentage: number | null
  entry_time: string
  exit_time: string | null
  status: string
}

interface MonthlyData {
  month: string
  trades_count: number
  winning_trades: number
  win_rate: number
  monthly_pnl: number
}

interface PerformanceData {
  total_profit_loss: number
  average_profit_loss: number
  best_trade: number
  worst_trade: number
}

export default function AnalyticsPage() {
  const router = useRouter()
  const [tradesData, setTradesData] = useState<Trade[]>([])
  const [monthlyPerformance, setMonthlyPerformance] = useState<MonthlyData[]>([])
  const [performance, setPerformance] = useState<PerformanceData | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadAnalytics = async () => {
      try {
        const supabase = createClient()
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        
        if (userError || !user) {
          router.push("/auth/login")
          return
        }

        // Fetch all trades for analytics
        const { data: trades } = await supabase
          .from("trades")
          .select("*")
          .eq("user_id", user.id)
          .order("entry_time", { ascending: true })

        // Process the data and set state
        setTradesData(trades || [])
        setMonthlyPerformance([])
        setPerformance(null)
      } catch (error) {
        console.error("Error loading analytics:", error)
        router.push("/auth/login")
      } finally {
        setIsLoading(false)
      }
    }

    loadAnalytics()
  }, [router])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-white">Loading analytics...</div>
      </div>
    )
  }

  // Calculate additional analytics
  const closedTrades = tradesData.filter((trade) => trade.status === "closed")
  const totalTrades = tradesData.length
  const winningTrades = closedTrades.filter((trade) => trade.profit_loss && trade.profit_loss > 0).length
  const losingTrades = closedTrades.filter((trade) => trade.profit_loss && trade.profit_loss < 0).length
  const winRate = closedTrades.length > 0 ? (winningTrades / closedTrades.length) * 100 : 0

  // Market distribution
  const marketDistribution = tradesData.reduce(
    (acc, trade) => {
      acc[trade.market_type] = (acc[trade.market_type] || 0) + 1
      return acc
    },
    {} as Record<string, number>,
  )

  // Trade type distribution
  const tradeTypeDistribution = tradesData.reduce(
    (acc, trade) => {
      acc[trade.trade_type] = (acc[trade.trade_type] || 0) + 1
      return acc
    },
    {} as Record<string, number>,
  )

  // Cumulative P&L data for chart
  const cumulativePnL = closedTrades.reduce(
    (acc, trade, index) => {
      const prevTotal = index > 0 ? acc[index - 1].cumulative : 0
      const currentPnL = trade.profit_loss || 0
      acc.push({
        date: new Date(trade.exit_time || trade.entry_time).toLocaleDateString(),
        pnl: currentPnL,
        cumulative: prevTotal + currentPnL,
        trade: index + 1,
      })
      return acc
    },
    [] as Array<{ date: string; pnl: number; cumulative: number; trade: number }>,
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="border-b border-slate-700 bg-slate-800/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="sm"
                asChild
                className="border-slate-600 text-slate-300 hover:bg-slate-700 bg-transparent"
              >
                <Link href="/dashboard">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </Link>
              </Button>
              <h1 className="text-2xl font-bold text-white">Trading Analytics</h1>
              <Badge variant="outline" className="border-purple-600 text-purple-400">
                Performance Analysis
              </Badge>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="border-slate-700 bg-slate-800/50 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-300">Total Trades</CardTitle>
              <BarChart3 className="h-4 w-4 text-slate-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{totalTrades}</div>
              <p className="text-xs text-slate-500">
                {closedTrades.length} closed, {totalTrades - closedTrades.length} open
              </p>
            </CardContent>
          </Card>

          <Card className="border-slate-700 bg-slate-800/50 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-300">Win Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{winRate.toFixed(1)}%</div>
              <p className="text-xs text-slate-500">
                {winningTrades}W / {losingTrades}L
              </p>
            </CardContent>
          </Card>

          <Card className="border-slate-700 bg-slate-800/50 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-300">Total P&L</CardTitle>
              <TrendingUp className="h-4 w-4 text-slate-400" />
            </CardHeader>
            <CardContent>
              <div
                className={`text-2xl font-bold ${(performance?.total_profit_loss || 0) >= 0 ? "text-green-400" : "text-red-400"}`}
              >
                ${(performance?.total_profit_loss || 0).toFixed(2)}
              </div>
              <p className="text-xs text-slate-500">
                Avg: ${performance?.average_profit_loss?.toFixed(2) || "0.00"} per trade
              </p>
            </CardContent>
          </Card>

          <Card className="border-slate-700 bg-slate-800/50 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-300">Best Trade</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-400">${performance?.best_trade?.toFixed(2) || "0.00"}</div>
              <p className="text-xs text-slate-500">Highest single trade profit</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Cumulative P&L Chart */}
          <Card className="border-slate-700 bg-slate-800/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white">Cumulative P&L</CardTitle>
              <CardDescription className="text-slate-400">Your profit and loss over time</CardDescription>
            </CardHeader>
            <CardContent>
              <ProfitLossChart data={cumulativePnL} />
            </CardContent>
          </Card>

          {/* Win Rate Trend */}
          <Card className="border-slate-700 bg-slate-800/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white">Win Rate Trend</CardTitle>
              <CardDescription className="text-slate-400">Win rate percentage over time</CardDescription>
            </CardHeader>
            <CardContent>
              <WinRateChart data={cumulativePnL} />
            </CardContent>
          </Card>
        </div>

        {/* Distribution Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Market Distribution */}
          <Card className="border-slate-700 bg-slate-800/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white">Market Distribution</CardTitle>
              <CardDescription className="text-slate-400">Trades by market type</CardDescription>
            </CardHeader>
            <CardContent>
              <MarketDistributionChart data={marketDistribution} />
            </CardContent>
          </Card>

          {/* Trade Type Distribution */}
          <Card className="border-slate-700 bg-slate-800/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white">Trade Types</CardTitle>
              <CardDescription className="text-slate-400">Distribution of trade types</CardDescription>
            </CardHeader>
            <CardContent>
              <TradeTypeChart data={tradeTypeDistribution} />
            </CardContent>
          </Card>

          {/* Risk Analysis */}
          <Card className="border-slate-700 bg-slate-800/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white">Risk Analysis</CardTitle>
              <CardDescription className="text-slate-400">Risk metrics overview</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span className="text-slate-400">Best Trade:</span>
                <span className="text-green-400">${performance?.best_trade?.toFixed(2) || "0.00"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Worst Trade:</span>
                <span className="text-red-400">${Math.abs(performance?.worst_trade || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Risk/Reward:</span>
                <span className="text-white">
                  {performance?.worst_trade && performance.worst_trade !== 0
                    ? (performance.best_trade / Math.abs(performance.worst_trade)).toFixed(2)
                    : "N/A"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Avg Win:</span>
                <span className="text-green-400">
                  $
                  {closedTrades.length > 0
                    ? (
                        closedTrades
                          .filter((t) => t.profit_loss && t.profit_loss > 0)
                          .reduce((sum, t) => sum + (t.profit_loss || 0), 0) / winningTrades || 0
                      ).toFixed(2)
                    : "0.00"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Avg Loss:</span>
                <span className="text-red-400">
                  $
                  {closedTrades.length > 0
                    ? Math.abs(
                        closedTrades
                          .filter((t) => t.profit_loss && t.profit_loss < 0)
                          .reduce((sum, t) => sum + (t.profit_loss || 0), 0) / losingTrades || 0,
                      ).toFixed(2)
                    : "0.00"}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Monthly Performance */}
        {monthlyPerformance.length > 0 && (
          <Card className="border-slate-700 bg-slate-800/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white">Monthly Performance</CardTitle>
              <CardDescription className="text-slate-400">Performance breakdown by month</CardDescription>
            </CardHeader>
            <CardContent>
              <MonthlyPerformanceChart data={monthlyPerformance} />
            </CardContent>
          </Card>
        )}

        {/* No Data State */}
        {totalTrades === 0 && (
          <Card className="border-slate-700 bg-slate-800/50 backdrop-blur-sm">
            <CardContent className="text-center py-12">
              <PieChart className="h-12 w-12 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-white mb-2">No Trading Data</h3>
              <p className="text-slate-400 mb-6">Start recording your trades to see detailed analytics and insights.</p>
              <Button asChild className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105">
                <Link href="/trades/new">Record Your First Trade</Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
