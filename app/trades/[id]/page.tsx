import Link from "next/link"
import { redirect } from "next/navigation"
import { ArrowLeft, BarChart3, Info, MessageSquare, Target } from "lucide-react"
import { format, subDays, addDays } from "date-fns"

import { auth } from "@/auth"
import { TradingViewChart } from "@/components/charts/tradingview-chart"
import { AppShell } from "@/components/layout/app-shell"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getBarsForSymbolWithFallback } from "@/lib/data/bars"
import { getTradeById } from "@/lib/data/trades"

function formatCurrency(value: number | null | undefined, decimals = 2) {
  if (value === null || value === undefined || Number.isNaN(value)) return "-"
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: decimals }).format(value)
}

export default async function TradeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) redirect("/auth/login")

  const { id } = await params
  const trade = await getTradeById(id, session.user.id)

  if (!trade) {
    redirect("/dashboard")
  }

  const isLong = trade.tradeType.toLowerCase() === "long" || trade.tradeType.toLowerCase() === "buy"
  const pnl = trade.profitLoss ?? 0
  const isWinner = pnl > 0

  const chartStart = subDays(trade.entryTime, 30)
  const chartEnd = addDays(trade.exitTime ?? trade.entryTime, 30)
  const chart = await getBarsForSymbolWithFallback(trade.symbol, chartStart, chartEnd)
  const bars = chart.bars

  const markers: any[] = []
  if (trade.entryTime) {
    markers.push({
      time: format(trade.entryTime, "yyyy-MM-dd"),
      position: isLong ? "belowBar" : "aboveBar",
      color: isLong ? "#10b981" : "#f43f5e",
      shape: isLong ? "arrowUp" : "arrowDown",
      text: `Entry @ ${formatCurrency(Number(trade.entryPrice))}`,
    })
  }

  if (trade.exitTime && trade.exitPrice) {
    markers.push({
      time: format(trade.exitTime, "yyyy-MM-dd"),
      position: isLong ? "aboveBar" : "belowBar",
      color: "#3b82f6",
      shape: isLong ? "arrowDown" : "arrowUp",
      text: `Exit @ ${formatCurrency(Number(trade.exitPrice))}`,
    })
  }

  return (
    <AppShell
      title={`Trade Detail: ${trade.symbol}`}
      cta={
        <div className="flex w-full gap-2 sm:w-auto">
          <Button variant="outline" size="sm" asChild>
            <Link href="/dashboard">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href={`/trades/${trade.id}/edit`}>Edit</Link>
          </Button>
        </div>
      }
    >
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          <Card className="terminal-panel overflow-hidden">
            <CardHeader className="flex flex-col gap-3 pb-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <CardTitle className="flex items-center gap-2 text-xl text-white">
                  <BarChart3 className="h-5 w-5 text-indigo-400" />
                  {trade.symbol} Chart
                </CardTitle>
                <CardDescription>
                  {bars.length
                    ? chart.source === "local"
                      ? "Historical daily bars from local market data"
                      : "Historical daily bars loaded from Yahoo fallback"
                    : "No market data available for this trade yet"}
                </CardDescription>
              </div>
              <Badge variant={isLong ? "default" : "destructive"} className="px-3 py-1 text-sm">
                {isLong ? "LONG" : "SHORT"}
              </Badge>
            </CardHeader>
            <CardContent className="relative border-t border-border/60 p-0">
              {bars.length ? (
                <div className="h-[360px] w-full sm:h-[440px] lg:h-[500px]">
                  <TradingViewChart data={bars} markers={markers} />
                </div>
              ) : (
                <div className="flex h-[360px] items-center justify-center bg-slate-950/40 p-5 text-center text-sm text-muted-foreground sm:h-[440px] sm:p-8 lg:h-[500px]">
                  No local bars or Yahoo fallback data were found for this symbol and date range.
                </div>
              )}

              <div className="terminal-panel-muted static flex gap-4 rounded-none border-x-0 border-b-0 p-3 shadow-xl sm:absolute sm:left-4 sm:top-4 sm:rounded-lg">
                <div className="flex flex-col">
                  <span className="text-xs font-semibold uppercase text-muted-foreground">Net P&L</span>
                  <span className={`text-lg font-bold ${isWinner ? "text-emerald-400" : "text-rose-400"}`}>
                    {isWinner ? "+" : ""}{formatCurrency(pnl)}
                  </span>
                </div>
                <div className="w-px bg-border"></div>
                <div className="flex flex-col">
                  <span className="text-xs font-semibold uppercase text-muted-foreground">Quantity</span>
                  <span className="text-lg font-bold text-slate-200">{trade.quantity}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="terminal-panel">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg text-white">
                <MessageSquare className="h-5 w-5 text-slate-400" />
                Journal Notes
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-muted-foreground">Mistakes / Lessons</h4>
                  <p className="terminal-panel-muted min-h-[80px] rounded-lg p-3 text-sm text-slate-300">
                    {trade.lessonsLearned || "No lessons recorded for this trade."}
                  </p>
                </div>
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-muted-foreground">Additional Notes</h4>
                  <p className="terminal-panel-muted min-h-[80px] rounded-lg p-3 text-sm text-slate-300">
                    {trade.additionalNotes || "No notes."}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="terminal-panel">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg text-white">
                <Info className="h-5 w-5 text-slate-400" />
                Execution Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <DetailRow label="Entry Time" value={format(trade.entryTime, "MMM dd, yyyy HH:mm")} />
              <DetailRow label="Exit Time" value={trade.exitTime ? format(trade.exitTime, "MMM dd, yyyy HH:mm") : "Open"} />
              <DetailRow label="Entry Price" value={formatCurrency(Number(trade.entryPrice))} />
              <DetailRow label="Exit Price" value={formatCurrency(Number(trade.exitPrice))} />
              <DetailRow label="Stop Loss" value={formatCurrency(Number(trade.stopLoss))} />
              <DetailRow label="Take Profit" value={formatCurrency(Number(trade.takeProfit))} />
            </CardContent>
          </Card>

          <Card className="terminal-panel">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg text-white">
                <Target className="h-5 w-5 text-slate-400" />
                Setup & Psychology
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <MetaBlock label="Trade Setup" value={trade.tradeSetup || "Uncategorized"} badge />
              <MetaBlock label="Emotional State" value={trade.emotionalState || "Neutral"} badge />
              <MetaBlock label="Market Condition" value={trade.marketCondition || "Not specified"} />
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  )
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-border/60 py-2 last:border-b-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium text-slate-200">{value}</span>
    </div>
  )
}

function MetaBlock({ label, value, badge = false }: { label: string; value: string; badge?: boolean }) {
  return (
    <div className="space-y-1">
      <span className="text-xs uppercase text-muted-foreground">{label}</span>
      {badge ? (
        <div className="flex gap-2">
          <Badge variant="secondary" className="border border-primary/20 bg-primary/10 text-primary">
            {value}
          </Badge>
        </div>
      ) : (
        <div className="text-sm text-slate-300">{value}</div>
      )}
    </div>
  )
}
