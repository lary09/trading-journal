import { redirect } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Edit, Target, Calendar, BarChart3, TrendingUp, TrendingDown, Info, MessageSquare } from "lucide-react"
import { format } from "date-fns"

import { auth } from "@/auth"
import { getTradeById } from "@/lib/data/trades"
import { AppShell } from "@/components/layout/app-shell"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { TradingViewChart } from "@/components/charts/tradingview-chart"

function formatCurrency(value: number | null | undefined, decimals = 2) {
  if (value === null || value === undefined) return "-"
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: decimals }).format(value)
}

function generateMockCandles(entryDate: Date, entryPrice: number, exitPrice: number | null, isLong: boolean) {
  // Generate 60 days of mock prices around the trade
  const candles = []
  let currentPrice = entryPrice * 0.9 // Start slightly below
  const startTimestamp = new Date(entryDate).getTime() - 30 * 24 * 60 * 60 * 1000 // 30 days before

  for (let i = 0; i < 60; i++) {
    const time = new Date(startTimestamp + i * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
    
    // Random walk
    const volatility = currentPrice * 0.02
    const change = (Math.random() - 0.5) * volatility
    const open = currentPrice
    const close = currentPrice + change
    const high = Math.max(open, close) + Math.random() * volatility * 0.5
    const low = Math.min(open, close) - Math.random() * volatility * 0.5
    
    candles.push({ time, open, high, low, close })
    currentPrice = close
  }

  // Ensure entry and exit roughly align if possible (this is just for mockup visuals)
  const entryDateStr = format(entryDate, "yyyy-MM-dd")
  const entryIdx = candles.findIndex(c => c.time === entryDateStr)
  if (entryIdx !== -1) {
    candles[entryIdx].open = entryPrice
    candles[entryIdx].close = isLong ? entryPrice * 1.01 : entryPrice * 0.99
  }

  return candles
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

  // Mock charting data for demonstration
  const mockCandles = generateMockCandles(
    trade.entryTime, 
    trade.entryPrice ? Number(trade.entryPrice) : 100, 
    trade.exitPrice ? Number(trade.exitPrice) : null, 
    isLong
  )
  
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
      color: "#3b82f6", // Blue for exit
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
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Link>
          </Button>
          <Button size="sm" variant="secondary" asChild>
            <Link href={`/trades/${trade.id}/edit`}>
              <Edit className="h-4 w-4 mr-2" />
              Edit Setup
            </Link>
          </Button>
        </div>
      }
    >
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Main Chart Area */}
        <div className="xl:col-span-2 space-y-6">
          <Card className="bg-slate-900/60 border-slate-800 backdrop-blur-md overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <CardTitle className="text-xl flex items-center gap-2 text-white">
                  <BarChart3 className="h-5 w-5 text-indigo-400" />
                  {trade.symbol} Chart
                </CardTitle>
                <CardDescription className="text-slate-400">1D Timeframe (Mocked Data Execution)</CardDescription>
              </div>
              <Badge variant={isLong ? "default" : "destructive"} className="text-sm px-3 py-1">
                {isLong ? "LONG" : "SHORT"}
              </Badge>
            </CardHeader>
            <CardContent className="p-0 border-t border-slate-800/50 relative">
              <div className="w-full h-[500px]">
                <TradingViewChart data={mockCandles} markers={markers} />
              </div>
              
              {/* Floating overlay on chart */}
              <div className="absolute top-4 left-4 bg-slate-950/80 border border-slate-800 backdrop-blur-md rounded-lg p-3 flex gap-4 shadow-xl">
                 <div className="flex flex-col">
                   <span className="text-xs text-slate-500 uppercase font-semibold">Net P&L</span>
                   <span className={`text-lg font-bold ${isWinner ? "text-emerald-400" : "text-rose-400"}`}>
                     {isWinner ? "+" : ""}{formatCurrency(pnl)}
                   </span>
                 </div>
                 <div className="w-px bg-slate-800"></div>
                 <div className="flex flex-col">
                   <span className="text-xs text-slate-500 uppercase font-semibold">Quantity</span>
                   <span className="text-lg font-bold text-slate-200">{trade.quantity}</span>
                 </div>
              </div>
            </CardContent>
          </Card>

          {/* Qualitative Data */}
          <Card className="bg-slate-900/60 border-slate-800 backdrop-blur-md">
            <CardHeader>
               <CardTitle className="text-lg flex items-center gap-2 text-white">
                 <MessageSquare className="h-5 w-5 text-slate-400" />
                 Journal Notes
               </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div className="space-y-2">
                   <h4 className="text-sm font-semibold text-slate-400">Mistakes / Lessons</h4>
                   <p className="text-sm text-slate-300 bg-slate-950/50 p-3 rounded-md border border-slate-800 min-h-[80px]">
                     {trade.lessonsLearned || "No lessons recorded for this trade."}
                   </p>
                 </div>
                 <div className="space-y-2">
                   <h4 className="text-sm font-semibold text-slate-400">Additional Notes</h4>
                   <p className="text-sm text-slate-300 bg-slate-950/50 p-3 rounded-md border border-slate-800 min-h-[80px]">
                     {trade.additionalNotes || "No notes."}
                   </p>
                 </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Trade Details Sidebar */}
        <div className="space-y-6">
          <Card className="bg-slate-900/60 border-slate-800 backdrop-blur-md">
            <CardHeader>
               <CardTitle className="text-lg flex items-center gap-2 text-white">
                 <Info className="h-5 w-5 text-slate-400" />
                 Execution Details
               </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
               
               <div className="flex justify-between items-center py-2 border-b border-slate-800/50">
                 <span className="text-sm text-slate-400">Entry Time</span>
                 <span className="text-sm font-medium text-slate-200">
                   {format(trade.entryTime, "MMM dd, yyyy HH:mm")}
                 </span>
               </div>
               
               <div className="flex justify-between items-center py-2 border-b border-slate-800/50">
                 <span className="text-sm text-slate-400">Exit Time</span>
                 <span className="text-sm font-medium text-slate-200">
                   {trade.exitTime ? format(trade.exitTime, "MMM dd, yyyy HH:mm") : "Open"}
                 </span>
               </div>

               <div className="flex justify-between items-center py-2 border-b border-slate-800/50">
                 <span className="text-sm text-slate-400">Entry Price</span>
                 <span className="text-sm font-medium text-slate-200">
                   {formatCurrency(Number(trade.entryPrice))}
                 </span>
               </div>

               <div className="flex justify-between items-center py-2 border-b border-slate-800/50">
                 <span className="text-sm text-slate-400">Exit Price</span>
                 <span className="text-sm font-medium text-slate-200">
                   {formatCurrency(Number(trade.exitPrice))}
                 </span>
               </div>

               <div className="flex justify-between items-center py-2 border-b border-slate-800/50">
                 <span className="text-sm text-slate-400">Stop Loss</span>
                 <span className="text-sm font-medium text-slate-200">
                   {formatCurrency(Number(trade.stopLoss))}
                 </span>
               </div>

               <div className="flex justify-between items-center py-2 border-b border-slate-800/50">
                 <span className="text-sm text-slate-400">Take Profit</span>
                 <span className="text-sm font-medium text-slate-200">
                   {formatCurrency(Number(trade.takeProfit))}
                 </span>
               </div>

            </CardContent>
          </Card>

          <Card className="bg-slate-900/60 border-slate-800 backdrop-blur-md">
            <CardHeader>
               <CardTitle className="text-lg flex items-center gap-2 text-white">
                 <Target className="h-5 w-5 text-slate-400" />
                 Setup & Psychology
               </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
               
               <div className="space-y-1">
                 <span className="text-xs text-slate-500 uppercase">Trade Setup</span>
                 <div className="flex gap-2">
                   <Badge variant="secondary" className="bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                     {trade.tradeSetup || "Uncategorized"}
                   </Badge>
                 </div>
               </div>

               <div className="space-y-1">
                 <span className="text-xs text-slate-500 uppercase">Emotional State</span>
                 <div className="flex gap-2">
                   <Badge variant="outline" className="border-slate-700 text-slate-300">
                     {trade.emotionalState || "Neutral"}
                   </Badge>
                 </div>
               </div>
               
               <div className="space-y-1">
                 <span className="text-xs text-slate-500 uppercase">Market Condition</span>
                 <div className="text-sm text-slate-300">
                   {trade.marketCondition || "Not specified"}
                 </div>
               </div>

            </CardContent>
          </Card>
        </div>

      </div>
    </AppShell>
  )
}
