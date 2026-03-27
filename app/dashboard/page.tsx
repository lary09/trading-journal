import Link from "next/link"
import { redirect } from "next/navigation"

import { auth, signOut } from "@/auth"
import { AppShell } from "@/components/layout/app-shell"
import { PerformanceChart } from "@/components/charts/performance-chart"
import { RiskBanner } from "@/components/risk/risk-banner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { getRecentTrades, getTradesForUser, NormalizedTrade } from "@/lib/data/trades"
import { BarChart3, Download, LogOut, Plus, Target, TrendingDown, TrendingUp, User } from "lucide-react"

function formatCurrency(value: number | null | undefined, decimals: number = 2) {
  if (value === null || value === undefined) return `$0.${"0".repeat(decimals)}`
  return `$${value.toFixed(decimals)}`
}

export default async function DashboardPage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/auth/login")

  const [trades, recentTrades] = await Promise.all([
    getTradesForUser(session.user.id),
    getRecentTrades(session.user.id, 5),
  ])

  const demoTrades: NormalizedTrade[] = [
    { id: "d1", userId: "demo", symbol: "AAPL", tradeType: "long", marketType: "stocks", entryPrice: 180, exitPrice: 190, quantity: 10, stopLoss: null, takeProfit: null, riskAmount: null, profitLoss: 100, profitLossPct: 0.055, commission: null, swap: null, entryTime: new Date("2024-03-01"), exitTime: new Date("2024-03-05"), status: "closed", tradeSetup: null, tradeOutcome: null, lessonsLearned: null, confidenceLevel: null, emotionalState: "confident", marketCondition: null, newsImpact: null, additionalNotes: null, chartScreenshotUrl: null, strategyId: null },
    { id: "d2", userId: "demo", symbol: "TSLA", tradeType: "long", marketType: "stocks", entryPrice: 240, exitPrice: 220, quantity: 5, stopLoss: null, takeProfit: null, riskAmount: null, profitLoss: -100, profitLossPct: -0.083, commission: null, swap: null, entryTime: new Date("2024-03-10"), exitTime: new Date("2024-03-14"), status: "closed", tradeSetup: null, tradeOutcome: null, lessonsLearned: null, confidenceLevel: null, emotionalState: "anxious", marketCondition: null, newsImpact: null, additionalNotes: null, chartScreenshotUrl: null, strategyId: null },
    { id: "d3", userId: "demo", symbol: "EURUSD", tradeType: "long", marketType: "fx", entryPrice: 1.08, exitPrice: 1.095, quantity: 10000, stopLoss: null, takeProfit: null, riskAmount: null, profitLoss: 150, profitLossPct: 0.013, commission: null, swap: null, entryTime: new Date("2024-03-20"), exitTime: new Date("2024-03-28"), status: "closed", tradeSetup: null, tradeOutcome: null, lessonsLearned: null, confidenceLevel: null, emotionalState: "calm", marketCondition: null, newsImpact: null, additionalNotes: null, chartScreenshotUrl: null, strategyId: null },
  ]

  const usingDemo = trades.length === 0
  const tradeSet = usingDemo ? demoTrades : trades

  const totalTrades = tradeSet.length
  const closedTrades = tradeSet.filter((t) => t.status === "closed")
  const winningTrades = closedTrades.filter((t) => (t.profitLoss ?? 0) > 0).length
  const losingTrades = closedTrades.filter((t) => (t.profitLoss ?? 0) < 0).length
  const winRate = closedTrades.length ? (winningTrades / closedTrades.length) * 100 : 0
  const totalPnl = closedTrades.reduce((acc, t) => acc + (t.profitLoss ?? 0), 0)
  const bestTrade = closedTrades.length ? Math.max(...closedTrades.map((t) => t.profitLoss ?? 0)) : 0
  const worstTrade = closedTrades.length ? Math.min(...closedTrades.map((t) => t.profitLoss ?? 0)) : 0

  const profitFactor = (() => {
    const winSum = closedTrades.filter((t) => (t.profitLoss ?? 0) > 0).reduce((a, t) => a + (t.profitLoss ?? 0), 0)
    const lossSum = closedTrades.filter((t) => (t.profitLoss ?? 0) < 0).reduce((a, t) => a + Math.abs(t.profitLoss ?? 0), 0)
    return lossSum === 0 ? winSum > 0 ? Infinity : 0 : winSum / lossSum
  })()

  const equity = closedTrades.reduce<number[]>((acc, t) => {
    const prev = acc.at(-1) ?? 0
    acc.push(prev + (t.profitLoss ?? 0))
    return acc
  }, [])
  const maxDrawdown = (() => {
    let peak = 0
    let dd = 0
    for (const v of equity) {
      if (v > peak) peak = v
      dd = Math.min(dd, v - peak)
    }
    return dd
  })()

  const chartData = tradeSet.slice(0, 60).reduce<Array<{ date: string; pnl: number; cumulative: number; trades: number }>>(
    (acc, t, idx) => {
      const prev = idx > 0 ? acc[idx - 1].cumulative : 0
      const pnl = Number(t.profitLoss ?? 0)
      acc.push({
        date: new Date(t.entryTime).toISOString().split("T")[0],
        pnl,
        cumulative: prev + pnl,
        trades: idx + 1,
      })
      return acc
    },
    []
  )

  return (
    <AppShell
      title="Dashboard"
      cta={
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <User className="h-4 w-4" />
            <span>{session.user.email ?? "Account"}</span>
          </div>
          <form action="/api/auth/signout" method="post">
            <Button type="submit" variant="outline" size="sm">
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </form>
        </div>
      }
    >
      <RiskBanner />
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
        <StatCard label="Total Trades" value={totalTrades} icon={<BarChart3 className="h-4 w-4" />} />
        <StatCard label="Win Rate" value={`${winRate.toFixed(1)}%`} icon={<Target className="h-4 w-4" />} />
        <StatCard
          label="Total P&L"
          value={formatCurrency(totalPnl)}
          icon={<TrendingUp className="h-4 w-4" />}
          tone={totalPnl >= 0 ? "positive" : "negative"}
        />
        <StatCard label="Best Trade" value={formatCurrency(bestTrade)} icon={<TrendingUp className="h-4 w-4" />} />
        <StatCard
          label="Profit Factor"
          value={profitFactor === Infinity ? "∞" : profitFactor.toFixed(2)}
          icon={<TrendingUp className="h-4 w-4" />}
          tone={profitFactor >= 1 ? "positive" : "negative"}
        />
        <StatCard
          label="Max Drawdown"
          value={formatCurrency(maxDrawdown)}
          icon={<TrendingDown className="h-4 w-4" />}
          tone={maxDrawdown >= 0 ? "positive" : "negative"}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
        <Card className="bg-slate-900/60 border-slate-800 col-span-2">
          <CardHeader>
            <CardTitle className="text-white">Performance</CardTitle>
            <CardDescription className="text-slate-400">Equity curve of your last trades</CardDescription>
          </CardHeader>
          <CardContent>{chartData.length ? <PerformanceChart data={chartData} /> : <EmptyChart />}</CardContent>
        </Card>

        <Card className="bg-slate-900/60 border-slate-800">
          <CardHeader>
            <CardTitle className="text-white">Risk Snapshot</CardTitle>
            <CardDescription className="text-slate-400">Best vs worst trades</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Progress value={Math.min(Math.abs(bestTrade), 100)} className="h-2" />
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-400">Best</span>
              <span className="text-emerald-400">{formatCurrency(bestTrade)}</span>
            </div>
            <Progress value={Math.min(Math.abs(worstTrade), 100)} className="h-2 bg-rose-950" />
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-400">Worst</span>
              <span className="text-rose-400">{formatCurrency(worstTrade)}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-slate-900/60 border-slate-800 mb-8">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-white">Recent Trades</CardTitle>
            <CardDescription className="text-slate-400">Last 5 executions</CardDescription>
          </div>
          <div className="flex gap-2">
            <Button asChild size="sm">
              <Link href="/trades/new">
                <Plus className="h-4 w-4 mr-2" />
                New trade
              </Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href="/export">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="divide-y divide-slate-800">
          {recentTrades.map((trade: NormalizedTrade) => (
            <div key={trade.id} className="py-3 flex items-center justify-between text-sm text-slate-200">
              <div className="flex items-center gap-3">
                <Badge variant="outline">{trade.symbol}</Badge>
                <span>{trade.tradeType}</span>
                <span className="text-slate-500">{new Date(trade.entryTime).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant={trade.profitLoss && trade.profitLoss > 0 ? "default" : "destructive"}>
                  {formatCurrency(trade.profitLoss)}
                </Badge>
                <Badge variant="secondary">{trade.marketType}</Badge>
              </div>
            </div>
          ))}
          {recentTrades.length === 0 && <div className="py-3 text-slate-500">No trades yet.</div>}
        </CardContent>
      </Card>
    </AppShell>
  )
}

function StatCard({
  label,
  value,
  icon,
  tone = "neutral",
}: {
  label: string
  value: string | number
  icon?: React.ReactNode
  tone?: "neutral" | "positive" | "negative"
}) {
  const color =
    tone === "positive" ? "text-emerald-400" : tone === "negative" ? "text-rose-400" : "text-slate-300"
  return (
    <Card className="bg-slate-900/60 border-slate-800">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-slate-400">{label}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className={`text-2xl font-semibold ${color}`}>{value}</div>
      </CardContent>
    </Card>
  )
}

function EmptyChart() {
  return <div className="h-64 flex items-center justify-center text-slate-500 text-sm">No data yet</div>
}
