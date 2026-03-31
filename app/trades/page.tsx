import Link from "next/link"
import { redirect } from "next/navigation"
import { Download, Plus } from "lucide-react"

import { auth } from "@/auth"
import { AppShell } from "@/components/layout/app-shell"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { getTradesForUser, NormalizedTrade } from "@/lib/data/trades"

function formatCurrency(value: number | null | undefined, decimals: number = 2) {
  if (value === null || value === undefined) return `$0.${"0".repeat(decimals)}`
  return `$${value.toFixed(decimals)}`
}

function formatPct(value: number | null | undefined) {
  if (value === null || value === undefined) return `0.00%`
  return `${(value * 100).toFixed(2)}%`
}

export default async function TradesPage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/auth/login")

  const trades = await getTradesForUser(session.user.id)

  return (
    <AppShell
      title="Trades Journal"
      cta={
        <div className="flex gap-2">
          <Button asChild>
            <Link href="/trades/new">
              <Plus className="h-4 w-4 mr-2" />
              Add Trade
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/export">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Link>
          </Button>
        </div>
      }
    >
      <Card className="bg-[#0f141e] border-slate-800 shadow-2xl mt-4">
        <CardHeader className="border-b border-slate-800/50 pb-4">
          <CardTitle className="text-white text-lg font-medium">Execution History</CardTitle>
          <CardDescription className="text-slate-400">
            {trades.length} trades recorded in your journal
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left font-mono">
              <thead className="text-xs text-slate-400 uppercase bg-slate-900/40 border-b border-slate-800">
                <tr>
                  <th className="px-4 py-3 font-semibold tracking-wider">Status</th>
                  <th className="px-4 py-3 font-semibold tracking-wider">Open Date</th>
                  <th className="px-4 py-3 font-semibold tracking-wider">Symbol</th>
                  <th className="px-4 py-3 font-semibold tracking-wider text-right">Entry</th>
                  <th className="px-4 py-3 font-semibold tracking-wider text-right">Exit</th>
                  <th className="px-4 py-3 font-semibold tracking-wider text-right">Size/Qty</th>
                  <th className="px-4 py-3 font-semibold tracking-wider text-right">Return $</th>
                  <th className="px-4 py-3 font-semibold tracking-wider text-right">Return %</th>
                  <th className="px-4 py-3 font-semibold tracking-wider text-center">Side</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {trades.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-8 text-center text-slate-500 font-sans">
                      No trades found. Start logging your executions.
                    </td>
                  </tr>
                ) : (
                  trades.map((trade: NormalizedTrade) => {
                    const pl = Number(trade.profitLoss ?? 0);
                    const pct = Number(trade.profitLossPct ?? 0);
                    const isWin = pl > 0;
                    const isLoss = pl < 0;
                    const isOpen = trade.status === "open";
                    
                    return (
                      <tr 
                        key={trade.id} 
                        className="hover:bg-slate-800/30 transition-colors group cursor-pointer"
                      >
                        <td className="px-4 py-2.5 whitespace-nowrap">
                          {isOpen ? (
                            <div className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold tracking-widest bg-amber-500/20 text-amber-500 uppercase border border-amber-500/30">
                              OPEN
                            </div>
                          ) : isWin ? (
                            <div className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold tracking-widest bg-emerald-500/20 text-emerald-400 uppercase border border-emerald-500/30">
                              WIN
                            </div>
                          ) : (
                            <div className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold tracking-widest bg-rose-500/20 text-rose-400 uppercase border border-rose-500/30">
                              LOSS
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-2.5 text-slate-300 whitespace-nowrap">
                          {new Date(trade.entryTime).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })}
                        </td>
                        <td className="px-4 py-2.5 whitespace-nowrap font-bold text-sky-400 tracking-wide">
                          {trade.symbol}
                        </td>
                        <td className="px-4 py-2.5 text-right text-slate-300">
                          {formatCurrency(Number(trade.entryPrice), 2)}
                        </td>
                        <td className="px-4 py-2.5 text-right text-slate-300">
                          {trade.exitPrice ? formatCurrency(Number(trade.exitPrice), 2) : "—"}
                        </td>
                        <td className="px-4 py-2.5 text-right text-slate-400">
                          {trade.quantity}
                        </td>
                        <td className={`px-4 py-2.5 text-right font-medium ${isWin ? "text-emerald-400" : isLoss ? "text-rose-400" : "text-amber-400"}`}>
                          {isOpen ? "—" : formatCurrency(pl)}
                        </td>
                        <td className={`px-4 py-2.5 text-right ${isWin ? "text-emerald-400/80" : isLoss ? "text-rose-400/80" : "text-amber-400/80"}`}>
                          {isOpen ? "—" : formatPct(pct)}
                        </td>
                        <td className="px-4 py-2.5 text-center">
                          <div className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold tracking-widest uppercase border ${trade.tradeType.toLowerCase() === 'long' ? 'border-emerald-500 text-emerald-400' : 'border-rose-500 text-rose-400'}`}>
                            {trade.tradeType}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </AppShell>
  )
}
