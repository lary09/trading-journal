import Link from "next/link"
import { redirect } from "next/navigation"
import { Calendar as CalendarIcon, ChevronRight } from "lucide-react"
import { eq, and } from "drizzle-orm"

import { auth } from "@/auth"
import { db } from "@/db/client"
import { dailyJournals } from "@/db/schema"
import { getTradesForUser, NormalizedTrade } from "@/lib/data/trades"
import { AppShell } from "@/components/layout/app-shell"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { JournalEditor } from "./journal-editor"

function formatCurrency(v: number | null | undefined) {
  if (!v) return "$0.00"
  return `$${v.toFixed(2)}`
}

export default async function JournalPage(props: { searchParams?: Promise<{ date?: string }> }) {
  const params = await props.searchParams
  const session = await auth()
  if (!session?.user?.id) redirect("/auth/login")

  const trades = await getTradesForUser(session.user.id)
  
  // Group trades by trading day (YYYY-MM-DD from entryTime)
  const grouped = trades.reduce<Record<string, NormalizedTrade[]>>((acc, trade) => {
    const d = new Date(trade.entryTime).toISOString().split("T")[0]
    if (!acc[d]) acc[d] = []
    acc[d].push(trade)
    return acc
  }, {})

  // Calculate day-level stats
  const dayStats = Object.entries(grouped).map(([date, dayTrades]) => {
    const netReturn = dayTrades.reduce((sum, t) => sum + (t.profitLoss ?? 0), 0)
    const commissions = dayTrades.reduce((sum, t) => sum + (t.commission ? Number(t.commission) : 0), 0)
    const grossReturn = netReturn + commissions // Simple approximation 

    const winners = dayTrades.filter((t) => (t.profitLoss ?? 0) > 0)
    const losers = dayTrades.filter((t) => (t.profitLoss ?? 0) <= 0)
    
    const winRate = dayTrades.length > 0 ? (winners.length / dayTrades.length) * 100 : 0
    
    const winSum = winners.reduce((a, t) => a + (t.profitLoss ?? 0), 0)
    const lossSum = losers.reduce((a, t) => a + Math.abs(t.profitLoss ?? 0), 0)
    const profitFactor = lossSum === 0 ? (winSum > 0 ? Infinity : 0) : winSum / lossSum

    return {
      date,
      trades: dayTrades,
      netReturn,
      grossReturn,
      winRate,
      profitFactor,
      commissions,
    }
  }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  const selectedDate = params?.date ?? (dayStats.length > 0 ? dayStats[0].date : "")
  const selectedStats = dayStats.find(d => d.date === selectedDate)

  // Fetch optional notes from daily_journals logic
  let initialNotes = ""
  if (selectedDate) {
    const [row] = await db
      .select({ notes: dailyJournals.notes })
      .from(dailyJournals)
      .where(and(eq(dailyJournals.userId, session.user.id), eq(dailyJournals.tradingDay, selectedDate)))
      .limit(1)
    if (row && row.notes) initialNotes = row.notes
  }

  return (
    <AppShell title="Daily Journal">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100vh-10rem)] max-h-[900px]">
        {/* LEFT COLUMN: Datelist */}
        <div className="lg:col-span-1 space-y-2 overflow-y-auto pr-2 custom-scrollbar">
          {dayStats.length === 0 && (
            <div className="p-4 text-center text-slate-500 bg-slate-900 border border-slate-800 rounded-md">
              No trading days yet
            </div>
          )}
          {dayStats.map((stat) => {
            const isSelected = stat.date === selectedDate
            const isGreen = stat.netReturn > 0
            const isRed = stat.netReturn < 0
            return (
              <Link 
                key={stat.date} 
                href={`?date=${stat.date}`}
                className={`block p-4 rounded-xl border transition-all ${isSelected ? 'bg-indigo-950/40 border-indigo-500 shadow-sm shadow-indigo-500/10' : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center text-sm font-semibold text-slate-200">
                    <CalendarIcon className="h-3.5 w-3.5 mr-1.5 opacity-70" />
                    {new Date(stat.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </div>
                  {isSelected && <ChevronRight className="h-4 w-4 text-indigo-400" />}
                </div>
                <div className={`text-xl font-bold tracking-tight ${isGreen ? 'text-emerald-400' : isRed ? 'text-rose-400' : 'text-slate-400'}`}>
                  {formatCurrency(stat.netReturn)}
                </div>
                <div className="text-xs text-slate-500 mt-1 flex justify-between">
                  <span>{stat.trades.length} Trades</span>
                  <span>{stat.winRate.toFixed(1)}% WinRate</span>
                </div>
              </Link>
            )
          })}
        </div>

        {/* RIGHT COLUMN: Details & Editor */}
        <div className="lg:col-span-3 flex flex-col gap-6 overflow-y-auto custom-scrollbar pb-6 pr-2">
          {!selectedStats ? (
             <Card className="bg-slate-900/60 border-slate-800 h-full flex items-center justify-center">
               <CardDescription>Select a day from the left to view journal details.</CardDescription>
             </Card>
          ) : (
            <>
              {/* Daily Performance Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatWidget label="Return Return" value={selectedStats.netReturn} isCurrency />
                <StatWidget label="Gross Return" value={selectedStats.grossReturn} isCurrency />
                <StatWidget label="Win %" value={selectedStats.winRate} suffix="%" />
                <StatWidget label="Profit Factor" value={selectedStats.profitFactor === Infinity ? "∞" : selectedStats.profitFactor.toFixed(2)} isValueString />
              </div>

              {/* Text Rich Journal Editor */}
              <Card className="bg-slate-900/60 border-slate-800 shadow-xl overflow-hidden">
                 <CardContent className="p-6">
                    <JournalEditor date={selectedDate} initialNotes={initialNotes} />
                 </CardContent>
              </Card>

              {/* Day Trades Dense Table */}
              <Card className="bg-[#0f141e] border-slate-800 shadow-2xl flex-1">
                 <CardHeader className="py-4 border-b border-slate-800">
                    <CardTitle className="text-sm text-slate-300 uppercase tracking-widest font-semibold">Executions for {new Date(selectedDate).toLocaleDateString()}</CardTitle>
                 </CardHeader>
                 <CardContent className="p-0">
                   <div className="overflow-x-auto">
                      <table className="w-full text-xs font-mono text-left">
                        <thead className="text-slate-500 uppercase bg-slate-900/40 border-b border-slate-800">
                          <tr>
                            <th className="px-3 py-2">Status</th>
                            <th className="px-3 py-2">Symbol</th>
                            <th className="px-3 py-2">Entry Time</th>
                            <th className="px-3 py-2 text-right">Entry</th>
                            <th className="px-3 py-2 text-right">Return $</th>
                            <th className="px-3 py-2 text-center">Side</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800">
                           {selectedStats.trades.map(t => {
                             const isWin = (t.profitLoss ?? 0) > 0
                             const isLoss = (t.profitLoss ?? 0) < 0
                             const isOpen = t.status === "open"
                             return (
                               <tr key={t.id} className="hover:bg-slate-800/40 cursor-pointer">
                                  <td className="px-3 py-2">
                                    {isOpen ? (
                                      <span className="bg-amber-500/20 text-amber-500 px-1.5 py-0.5 rounded text-[10px] uppercase font-bold">Open</span>
                                    ) : isWin ? (
                                      <span className="bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded text-[10px] uppercase font-bold">Win</span>
                                    ) : (
                                      <span className="bg-rose-500/20 text-rose-400 px-1.5 py-0.5 rounded text-[10px] uppercase font-bold">Loss</span>
                                    )}
                                  </td>
                                  <td className="px-3 py-2 font-bold text-sky-400">{t.symbol}</td>
                                  <td className="px-3 py-2 text-slate-400">{new Date(t.entryTime).toLocaleTimeString()}</td>
                                  <td className="px-3 py-2 text-right text-slate-300">{formatCurrency(t.entryPrice)}</td>
                                  <td className={`px-3 py-2 text-right font-medium ${isWin ? 'text-emerald-400' : isLoss ? 'text-rose-400' : 'text-slate-400'}`}>
                                    {isOpen ? "—" : formatCurrency(t.profitLoss)}
                                  </td>
                                  <td className="px-3 py-2 text-center">
                                     <span className={`px-1.5 py-0.5 rounded text-[9px] uppercase font-bold border ${t.tradeType === 'long' ? 'border-emerald-500 text-emerald-400' : 'border-rose-500 text-rose-400'}`}>{t.tradeType}</span>
                                  </td>
                               </tr>
                             )
                           })}
                        </tbody>
                      </table>
                   </div>
                 </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>
    </AppShell>
  )
}

function StatWidget({ label, value, isCurrency = false, isValueString = false, suffix = "" }: { label: string, value: number | string, isCurrency?: boolean, isValueString?: boolean, suffix?: string }) {
  const numValue = Number(value)
  const isPositive = !isValueString && numValue > 0
  const isNegative = !isValueString && numValue < 0
  
  return (
    <Card className="bg-slate-900 border-slate-800 p-4">
      <div className="text-xs uppercase tracking-widest text-slate-500 font-semibold mb-2">{label}</div>
      <div className={`text-xl font-bold font-mono ${isPositive ? 'text-emerald-400' : isNegative ? 'text-rose-400' : 'text-slate-300'}`}>
        {isCurrency ? formatCurrency(numValue) : isValueString ? value : numValue.toFixed(2)}{suffix}
      </div>
    </Card>
  )
}
