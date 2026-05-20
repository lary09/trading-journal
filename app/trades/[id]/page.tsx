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
import { getBarsForSymbol } from "@/lib/data/bars"
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
  const bars = await getBarsForSymbol(trade.symbol, chartStart, chartEnd)

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
        <div className="flex gap-2">
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
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <CardTitle className="flex items-center gap-2 text-xl text-white">
                  <BarChart3 className="h-5 w-5 text-indigo-400" />
                  {trade.symbol} Chart
                </CardTitle>
                <CardDescription>{bars.length ? "Historical daily bars from local market data" : "No local market data available for this trade yet"}</CardDescription>
              </div>
              <Badge variant={isLong ? "default" : "destructive"} className="px-3 py-1 text-sm">
                {isLong ? "LONG" : "SHORT"}
              </Badge>
            </CardHeader>
            <CardContent className="relative border-t border-border/60 p-0">
              {bars.length ? (
                <div className="h-[500px] w-full">
                  <TradingViewChart data={bars} markers={markers} />
                </div>
              ) : (
                <div className="flex h-[500px] items-center justify-center bg-slate-950/40 p-8 text-center text-sm text-muted-foreground">
                  Sync this symbol from the watchlist or provider routes to unlock real chart context for the trade detail page.
                </div>
              )}

              <div className="terminal-panel-muted absolute left-4 top-4 flex gap-4 rounded-lg p-3 shadow-xl">
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
