"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, BarChart3, TrendingUp, PieChart } from "lucide-react"

import { AppShell } from "@/components/layout/app-shell"
import { ProfitLossChart } from "@/components/charts/profit-loss-chart"
import { WinRateChart } from "@/components/charts/win-rate-chart"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

type Trade = {
  id: string
  symbol: string
  tradeType: string
  marketType: string
  profitLoss: number | null
  profitLossPct: number | null
  entryTime: string
  exitTime: string | null
  status: string
}

type ChartPoint = { date: string; pnl: number; cumulative: number; trade: number }

export default function AnalyticsPage() {
  const router = useRouter()
  const [trades, setTrades] = useState<Trade[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/trades", { credentials: "include" })
        if (res.status === 401) {
          router.push("/auth/login")
          return
        }
        const json = await res.json()
        setTrades(json.data ?? [])
      } catch (err) {
        console.error(err)
        router.push("/auth/login")
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [router])

  // Demo fallback para que se vean las gráficas aunque no haya datos reales todavía
  const demoClosed: Trade[] = [
    { id: "1", symbol: "AAPL", tradeType: "long", marketType: "stocks", profitLoss: 120, profitLossPct: 0.04, entryTime: "2024-01-02", exitTime: "2024-01-10", status: "closed" },
    { id: "2", symbol: "MSFT", tradeType: "long", marketType: "stocks", profitLoss: -60, profitLossPct: -0.02, entryTime: "2024-01-15", exitTime: "2024-01-20", status: "closed" },
    { id: "3", symbol: "TSLA", tradeType: "long", marketType: "stocks", profitLoss: 200, profitLossPct: 0.07, entryTime: "2024-02-01", exitTime: "2024-02-12", status: "closed" },
    { id: "4", symbol: "EURUSD", tradeType: "long", marketType: "fx", profitLoss: -40, profitLossPct: -0.01, entryTime: "2024-02-18", exitTime: "2024-02-25", status: "closed" },
    { id: "5", symbol: "NVDA", tradeType: "long", marketType: "stocks", profitLoss: 260, profitLossPct: 0.08, entryTime: "2024-03-05", exitTime: "2024-03-20", status: "closed" },
  ]
  const closedTrades = useMemo(() => trades.filter((t) => t.status === "closed"), [trades])
  const usingDemo = closedTrades.length === 0
  const closed = usingDemo ? demoClosed : closedTrades
  const totalTrades = trades.length
  const winningTrades = closed.filter((t) => Number(t.profitLoss ?? 0) > 0).length
  const losingTrades = closed.filter((t) => Number(t.profitLoss ?? 0) < 0).length
  const winRate = closed.length ? (winningTrades / closed.length) * 100 : 0
  const totalPnl = closed.reduce((acc, t) => acc + Number(t.profitLoss ?? 0), 0)
  const avgPnl = closed.length ? totalPnl / closed.length : 0
  const bestTrade = closed.length ? Math.max(...closed.map((t) => Number(t.profitLoss ?? 0))) : 0

  const cumulativePnL: ChartPoint[] = useMemo(() => {
    return closed.reduce<ChartPoint[]>((acc, trade, idx) => {
      const prev = idx > 0 ? acc[idx - 1].cumulative : 0
      const current = Number(trade.profitLoss ?? 0)
      acc.push({
        date: new Date(trade.exitTime ?? trade.entryTime).toLocaleDateString(),
        pnl: current,
        cumulative: prev + current,
        trade: idx + 1,
      })
      return acc
    }, [])
  }, [closedTrades])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-200">
        Loading analytics...
      </div>
    )
  }

  return (
    <AppShell
      title="Analytics"
      cta={
        <Button variant="outline" size="sm" asChild>
          <Link href="/dashboard">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Link>
        </Button>
      }
    >
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total Trades" value={totalTrades} icon={<BarChart3 className="h-4 w-4" />} />
        <StatCard label="Win Rate" value={`${winRate.toFixed(1)}%`} icon={<TrendingUp className="h-4 w-4" />} />
        <StatCard
          label="Total P&L"
          value={`$${totalPnl.toFixed(2)}`}
          tone={totalPnl >= 0 ? "positive" : "negative"}
        />
        <StatCard label="Best Trade" value={`$${bestTrade.toFixed(2)}`} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card className="bg-slate-900/60 border-slate-800">
          <CardHeader>
            <CardTitle className="text-white">Cumulative P&L</CardTitle>
            <CardDescription className="text-slate-400">
              Performance over time {usingDemo && "(demo data: carga trades para ver los tuyos)"}
            </CardDescription>
          </CardHeader>
          <CardContent>{cumulativePnL.length ? <ProfitLossChart data={cumulativePnL} /> : <EmptyChart />}</CardContent>
        </Card>

        <Card className="bg-slate-900/60 border-slate-800">
          <CardHeader>
            <CardTitle className="text-white">Win Rate</CardTitle>
            <CardDescription className="text-slate-400">Closed trades only</CardDescription>
          </CardHeader>
          <CardContent>{cumulativePnL.length ? <WinRateChart data={cumulativePnL} /> : <EmptyChart />}</CardContent>
        </Card>
      </div>

      {totalTrades === 0 && <EmptyState />}
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

function EmptyState() {
  return (
    <Card className="bg-slate-900/60 border-slate-800">
      <CardContent className="py-12 text-center space-y-4">
        <PieChart className="h-12 w-12 text-slate-500 mx-auto" />
        <div className="text-lg font-medium text-white">No trading data</div>
        <p className="text-slate-400">Start recording trades to unlock analytics.</p>
        <Button asChild className="bg-blue-600 hover:bg-blue-500 text-white">
          <Link href="/trades/new">Record your first trade</Link>
        </Button>
      </CardContent>
    </Card>
  )
}
