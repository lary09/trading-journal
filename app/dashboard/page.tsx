import Link from "next/link"
import { redirect } from "next/navigation"
import { ArrowUpRight, BarChart3, LogOut, Plus, Target, TrendingDown, TrendingUp, User } from "lucide-react"

import { auth } from "@/auth"
import { PerformanceChart } from "@/components/charts/performance-chart"
import { AppShell } from "@/components/layout/app-shell"
import { RiskBanner } from "@/components/risk/risk-banner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { getRecentTrades, getTradesForUser } from "@/lib/data/trades"

function formatCurrency(value: number | null | undefined, decimals = 2) {
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

  const tradeSet = trades
  const closedTrades = tradeSet.filter((trade) => trade.status === "closed")
  const totalTrades = tradeSet.length
  const winRate = closedTrades.length
    ? (closedTrades.filter((trade) => Number(trade.profitLoss ?? 0) > 0).length / closedTrades.length) * 100
    : 0
  const totalPnl = closedTrades.reduce((sum, trade) => sum + Number(trade.profitLoss ?? 0), 0)
  const bestTrade = closedTrades.length ? Math.max(...closedTrades.map((trade) => Number(trade.profitLoss ?? 0))) : 0
  const worstTrade = closedTrades.length ? Math.min(...closedTrades.map((trade) => Number(trade.profitLoss ?? 0))) : 0
  const profitFactor = (() => {
    const winSum = closedTrades.filter((trade) => Number(trade.profitLoss ?? 0) > 0).reduce((sum, trade) => sum + Number(trade.profitLoss ?? 0), 0)
    const lossSum = closedTrades.filter((trade) => Number(trade.profitLoss ?? 0) < 0).reduce((sum, trade) => sum + Math.abs(Number(trade.profitLoss ?? 0)), 0)
    return lossSum === 0 ? (winSum > 0 ? Infinity : 0) : winSum / lossSum
  })()
  const equity = closedTrades.reduce<number[]>((acc, trade) => {
    const previous = acc.at(-1) ?? 0
    acc.push(previous + Number(trade.profitLoss ?? 0))
    return acc
  }, [])
  const maxDrawdown = (() => {
    let peak = 0
    let drawdown = 0
    for (const value of equity) {
      if (value > peak) peak = value
      drawdown = Math.min(drawdown, value - peak)
    }
    return drawdown
  })()

  const chartData = tradeSet.slice(0, 60).reduce<Array<{ date: string; pnl: number; cumulative: number; trades: number }>>((acc, trade, index) => {
    const prev = index > 0 ? acc[index - 1].cumulative : 0
    const pnl = Number(trade.profitLoss ?? 0)
    acc.push({
      date: new Date(trade.entryTime).toISOString().split("T")[0],
      pnl,
      cumulative: prev + pnl,
      trades: index + 1,
    })
    return acc
  }, [])

  return (
    <AppShell
      title="Dashboard"
      cta={
        <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto md:gap-3">
          <div className="hidden items-center gap-2 text-sm text-muted-foreground md:flex">
            <User className="h-4 w-4" />
            <span>{session.user.email ?? "Account"}</span>
          </div>
          <form action="/api/auth/signout" method="post">
            <Button type="submit" variant="outline" size="sm">
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </Button>
          </form>
        </div>
      }
    >
      <RiskBanner />

      <section className="mb-6 md:mb-8 grid gap-4 md:gap-6 lg:grid-cols-2 xl:grid-cols-[1.2fr_0.8fr]">
        <Card className="terminal-panel overflow-hidden border-primary/10 py-6 md:py-7">
          <CardContent className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div className="min-w-0">
              <div className="terminal-kicker mb-3">Session Overview</div>
              <h2 className="text-2xl md:text-3xl lg:text-4xl font-semibold tracking-tight text-white">{tradeSet.length ? "Your execution desk is live." : "Your trading journal is ready."}</h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground md:text-base">
                {tradeSet.length
                  ? "Monitor current trade quality, review recent outcomes and keep risk in view before the next entry."
                  : "Log your first trade to unlock real dashboard metrics, recent executions and analytics."}
              </p>
            </div>
            <div className="grid w-full gap-3 sm:grid-cols-2 md:w-auto md:min-w-[240px]">
              <MetricTile label="Net closed P&L" value={formatCurrency(totalPnl)} tone={totalPnl >= 0 ? "positive" : "negative"} />
              <MetricTile label="Closed win rate" value={`${winRate.toFixed(1)}%`} />
            </div>
          </CardContent>
        </Card>
        <Card className="terminal-panel py-7">
          <CardContent className="space-y-4">
            <div className="terminal-kicker">Quick Actions</div>
            <div className="grid gap-3">
              <Button asChild className="justify-between"><Link href="/trades/new">Log New Trade <ArrowUpRight className="h-4 w-4" /></Link></Button>
              <Button asChild variant="outline" className="justify-between"><Link href="/journal">Open Daily Journal <ArrowUpRight className="h-4 w-4" /></Link></Button>
              <Button asChild variant="outline" className="justify-between"><Link href="/analytics">Inspect Analytics <ArrowUpRight className="h-4 w-4" /></Link></Button>
            </div>
          </CardContent>
        </Card>
      </section>

      <div className="mb-6 md:mb-8 grid grid-cols-2 gap-3 md:gap-4 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
        <StatCard label="Total Trades" value={totalTrades} icon={<BarChart3 className="h-4 w-4" />} />
        <StatCard label="Win Rate" value={`${winRate.toFixed(1)}%`} icon={<Target className="h-4 w-4" />} />
        <StatCard label="Total P&L" value={formatCurrency(totalPnl)} icon={<TrendingUp className="h-4 w-4" />} tone={totalPnl >= 0 ? "positive" : "negative"} />
        <StatCard label="Best Trade" value={formatCurrency(bestTrade)} icon={<TrendingUp className="h-4 w-4" />} />
        <StatCard label="Profit Factor" value={profitFactor === Infinity ? "∞" : profitFactor.toFixed(2)} icon={<TrendingUp className="h-4 w-4" />} tone={profitFactor >= 1 ? "positive" : "negative"} />
        <StatCard label="Max Drawdown" value={formatCurrency(maxDrawdown)} icon={<TrendingDown className="h-4 w-4" />} tone={maxDrawdown >= 0 ? "positive" : "negative"} />
      </div>

      <div className="mb-6 md:mb-8 grid grid-cols-1 gap-4 md:gap-6 lg:grid-cols-3">
        <Card className="terminal-panel lg:col-span-2">
          <CardHeader>
            <div className="terminal-kicker">Performance</div>
            <CardTitle className="text-white">Equity Curve</CardTitle>
            <CardDescription>Equity curve of your last trades</CardDescription>
          </CardHeader>
          <CardContent>{chartData.length ? <PerformanceChart data={chartData} /> : <EmptyChart />}</CardContent>
        </Card>

        <Card className="terminal-panel">
          <CardHeader>
            <div className="terminal-kicker">Risk Snapshot</div>
            <CardTitle className="text-white">Distribution</CardTitle>
            <CardDescription>Best vs worst trades</CardDescription>
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

      {tradeSet.length === 0 && (
        <Card className="terminal-panel mb-8 border-dashed py-8">
          <CardContent className="flex flex-col items-center justify-center text-center">
            <BarChart3 className="mb-3 h-8 w-8 text-muted-foreground" />
            <div className="text-lg font-medium text-white">No trades logged yet</div>
            <p className="mt-2 max-w-xl text-sm text-muted-foreground">
              The dashboard no longer uses demo trades. Your real metrics will appear here as soon as you record your first execution.
            </p>
            <div className="mt-5 flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
              <Button asChild><Link href="/trades/new">Log First Trade</Link></Button>
              <Button variant="outline" asChild><Link href="/imports">Import CSV</Link></Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="terminal-table mb-8 border-border/70 bg-transparent py-0 shadow-none">
        <CardHeader className="flex flex-col gap-3 border-b border-slate-800/50 pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="terminal-kicker">Recent Executions</div>
            <CardTitle className="text-lg font-medium text-white">Recent Trades</CardTitle>
            <CardDescription>Your last 5 executions</CardDescription>
          </div>
          <div className="flex gap-2">
            <Button asChild size="sm"><Link href="/trades/new"><Plus className="mr-2 h-4 w-4" />Add</Link></Button>
            <Button variant="outline" size="sm" asChild><Link href="/trades">View All</Link></Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-sm">
              <thead className="border-b border-slate-800 text-xs uppercase text-slate-400">
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
                {recentTrades.map((trade) => {
                  const pl = Number(trade.profitLoss ?? 0)
                  const isWin = pl > 0
                  const isLoss = pl < 0
                  const isOpen = trade.status === "open"
                  return (
                    <tr key={trade.id} className="group cursor-pointer transition-colors hover:bg-slate-800/30">
                      <td className="whitespace-nowrap px-4 py-2.5">
                        <StatusPill state={isOpen ? "open" : isWin ? "win" : "loss"} />
                      </td>
                      <td className="whitespace-nowrap px-4 py-2.5 font-bold tracking-wide text-sky-400">{trade.symbol}</td>
                      <td className={`px-4 py-2.5 text-right font-medium ${isWin ? "text-emerald-400" : isLoss ? "text-rose-400" : "text-amber-400"}`}>{isOpen ? "—" : formatCurrency(pl)}</td>
                      <td className="px-4 py-2.5 text-center"><SidePill tradeType={trade.tradeType} /></td>
                      <td className="px-4 py-2.5 text-right text-slate-400">{new Date(trade.entryTime).toLocaleDateString("en-US", { month: "short", day: "2-digit" })}</td>
                      <td className="px-4 py-2.5 text-right"><Button variant="ghost" size="sm" asChild className="h-6 text-xs text-slate-500 hover:text-white"><Link href={`/trades/${trade.id}`}>View</Link></Button></td>
                    </tr>
                  )
                })}
                {recentTrades.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-6 text-center font-sans text-slate-500">No recent trades.</td>
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

function StatCard({ label, value, icon, tone = "neutral" }: { label: string; value: string | number; icon?: React.ReactNode; tone?: "neutral" | "positive" | "negative" }) {
  const color = tone === "positive" ? "text-emerald-400" : tone === "negative" ? "text-rose-400" : "text-slate-300"
  return (
    <Card className="terminal-panel py-5">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-slate-400">{label}</CardTitle>
        <div className="text-muted-foreground">{icon}</div>
      </CardHeader>
      <CardContent>
        <div className={`text-2xl font-semibold ${color}`}>{value}</div>
      </CardContent>
    </Card>
  )
}

function MetricTile({ label, value, tone = "neutral" }: { label: string; value: string; tone?: "neutral" | "positive" | "negative" }) {
  const color = tone === "positive" ? "text-emerald-400" : tone === "negative" ? "text-rose-400" : "text-white"
  return (
    <div className="terminal-panel-muted p-4">
      <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">{label}</div>
      <div className={`mt-2 text-2xl font-semibold ${color}`}>{value}</div>
    </div>
  )
}

function StatusPill({ state }: { state: "open" | "win" | "loss" }) {
  const styles = state === "open"
    ? "border-amber-500/30 bg-amber-500/20 text-amber-500"
    : state === "win"
      ? "border-emerald-500/30 bg-emerald-500/20 text-emerald-400"
      : "border-rose-500/30 bg-rose-500/20 text-rose-400"

  return <div className={`inline-flex items-center rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest border ${styles}`}>{state}</div>
}

function SidePill({ tradeType }: { tradeType: string }) {
  const isLong = tradeType.toLowerCase() === "long"
  return (
    <div className={`inline-flex items-center rounded border px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest ${isLong ? "border-emerald-500 text-emerald-400" : "border-rose-500 text-rose-400"}`}>
      {tradeType}
    </div>
  )
}

function EmptyChart() {
  return <div className="flex h-64 items-center justify-center text-sm text-slate-500">No data yet</div>
}
