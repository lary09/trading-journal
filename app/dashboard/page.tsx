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
    { id: "d1", userId: "demo", symbol: "AAPL", tradeType: "long", marketType: "stocks", entryPrice: "180", exitPrice: "190", quantity: "10", stopLoss: "175", takeProfit: "200", riskAmount: "50", profitLoss: "100", profitLossPct: "0.055", commission: "0", swap: "0", entryTime: new Date("2024-03-01"), exitTime: new Date("2024-03-05"), status: "closed", tradeSetup: null, tradeOutcome: null, lessonsLearned: null, confidenceLevel: null, emotionalState: "confident", marketCondition: null, newsImpact: null, additionalNotes: null, chartScreenshotUrl: null, strategyId: null, createdAt: new Date("2024-03-01"), updatedAt: new Date("2024-03-05") },
    { id: "d2", userId: "demo", symbol: "TSLA", tradeType: "long", marketType: "stocks", entryPrice: "240", exitPrice: "220", quantity: "5", stopLoss: "210", takeProfit: "280", riskAmount: "150", profitLoss: "-100", profitLossPct: "-0.083", commission: "0", swap: "0", entryTime: new Date("2024-03-10"), exitTime: new Date("2024-03-14"), status: "closed", tradeSetup: null, tradeOutcome: null, lessonsLearned: null, confidenceLevel: null, emotionalState: "anxious", marketCondition: null, newsImpact: null, additionalNotes: null, chartScreenshotUrl: null, strategyId: null, createdAt: new Date("2024-03-10"), updatedAt: new Date("2024-03-14") },
    { id: "d3", userId: "demo", symbol: "EURUSD", tradeType: "long", marketType: "fx", entryPrice: "1.08", exitPrice: "1.095", quantity: "10000", stopLoss: "1.07", takeProfit: "1.12", riskAmount: "100", profitLoss: "150", profitLossPct: "0.013", commission: "0", swap: "0", entryTime: new Date("2024-03-20"), exitTime: new Date("2024-03-28"), status: "closed", tradeSetup: null, tradeOutcome: null, lessonsLearned: null, confidenceLevel: null, emotionalState: "calm", marketCondition: null, newsImpact: null, additionalNotes: null, chartScreenshotUrl: null, strategyId: null, createdAt: new Date("2024-03-20"), updatedAt: new Date("2024-03-28") },
  ]

  const usingDemo = trades.length === 0
  const tradeSet = usingDemo ? demoTrades : trades

  const totalTrades = tradeSet.length
  const closedTrades = tradeSet.filter((t) => t.status === "closed")
  const winningTrades = closedTrades.filter((t) => Number(t.profitLoss ?? 0) > 0).length
  const losingTrades = closedTrades.filter((t) => Number(t.profitLoss ?? 0) < 0).length
  const winRate = closedTrades.length ? (winningTrades / closedTrades.length) * 100 : 0
  const totalPnl = closedTrades.reduce((acc, t) => acc + Number(t.profitLoss ?? 0), 0)
  const bestTrade = closedTrades.length ? Math.max(...closedTrades.map((t) => Number(t.profitLoss ?? 0))) : 0
  const worstTrade = closedTrades.length ? Math.min(...closedTrades.map((t) => Number(t.profitLoss ?? 0))) : 0

  const profitFactor = (() => {
    const winSum = closedTrades.filter((t) => Number(t.profitLoss ?? 0) > 0).reduce((a, t) => a + Number(t.profitLoss ?? 0), 0)
    const lossSum = closedTrades.filter((t) => Number(t.profitLoss ?? 0) < 0).reduce((a, t) => a + Math.abs(Number(t.profitLoss ?? 0)), 0)
    return lossSum === 0 ? (winSum > 0 ? Infinity : 0) : winSum / lossSum
  })()

  const equity = closedTrades.reduce<number[]>((acc, t) => {
    const prev = acc.at(-1) ?? 0
    acc.push(prev + Number(t.profitLoss ?? 0))
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

      <Card className="bg-[#0f141e] border-slate-800 mb-8 overflow-hidden shadow-2xl">
        <CardHeader className="flex flex-row items-center justify-between border-b border-slate-800/50 pb-4">
          <div>
            <CardTitle className="text-white text-lg font-medium">Recent Trades</CardTitle>
            <CardDescription className="text-slate-400">Your last 5 executions</CardDescription>
          </div>
          <div className="flex gap-2">
            <Button asChild size="sm">
              <Link href="/trades/new">
                <Plus className="h-4 w-4 mr-2" />
                Add
              </Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href="/trades">
                View All
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left font-mono">
              <thead className="text-xs text-slate-400 uppercase bg-slate-900/40 border-b border-slate-800">
                <tr>
                  <th className="px-4 py-3 font-semibold tracking-wider">Status</th>
                  <th className="px-4 py-3 font-semibold tracking-wider">Symbol</th>
                  <th className="px-4 py-3 font-semibold tracking-wider text-right">Return $</th>
                  <th className="px-4 py-3 font-semibold tracking-wider text-center">Side</th>
                  <th className="px-4 py-3 font-semibold tracking-wider text-right">Date</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {recentTrades.map((trade: NormalizedTrade) => {
                  const pl = Number(trade.profitLoss ?? 0);
                  const isWin = pl > 0;
                  const isLoss = pl < 0;
                  const isOpen = trade.status === "open";
                  return (
                    <tr key={trade.id} className="hover:bg-slate-800/30 transition-colors group cursor-pointer">
                      <td className="px-4 py-2.5 whitespace-nowrap">
                        {isOpen ? (
                          <div className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold tracking-widest bg-amber-500/20 text-amber-500 uppercase border border-amber-500/30">OPEN</div>
                        ) : isWin ? (
                          <div className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold tracking-widest bg-emerald-500/20 text-emerald-400 uppercase border border-emerald-500/30">WIN</div>
                        ) : (
                          <div className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold tracking-widest bg-rose-500/20 text-rose-400 uppercase border border-rose-500/30">LOSS</div>
                        )}
                      </td>
                      <td className="px-4 py-2.5 whitespace-nowrap font-bold text-sky-400 tracking-wide">
                        {trade.symbol}
                      </td>
                      <td className={`px-4 py-2.5 text-right font-medium ${isWin ? "text-emerald-400" : isLoss ? "text-rose-400" : "text-amber-400"}`}>
                        {isOpen ? "—" : formatCurrency(pl)}
                      </td>
                      <td className="px-4 py-2.5 text-center">
                        <div className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold tracking-widest uppercase border ${trade.tradeType.toLowerCase() === 'long' ? 'border-emerald-500 text-emerald-400' : 'border-rose-500 text-rose-400'}`}>
                          {trade.tradeType}
                        </div>
                      </td>
                      <td className="px-4 py-2.5 text-right text-slate-400">
                        {new Date(trade.entryTime).toLocaleDateString('en-US', { month: 'short', day: '2-digit' })}
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        <Button variant="ghost" size="sm" asChild className="h-6 text-xs text-slate-500 hover:text-white">
                           <Link href={`/trades/${trade.id}`}>View</Link>
                        </Button>
                      </td>
                    </tr>
                  )
                })}
                {recentTrades.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-6 text-center text-slate-500 font-sans">No recent trades.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
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
