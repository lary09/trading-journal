import Link from "next/link"
import { redirect } from "next/navigation"
import { Download, Plus } from "lucide-react"

import { auth } from "@/auth"
import { AppShell } from "@/components/layout/app-shell"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getTradesForUser } from "@/lib/data/trades"

function formatCurrency(value: number | null | undefined, decimals = 2) {
  if (value === null || value === undefined) return `$0.${"0".repeat(decimals)}`
  return `$${value.toFixed(decimals)}`
}

function formatPct(value: number | null | undefined) {
  if (value === null || value === undefined) return "0.00%"
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
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
          <Button asChild><Link href="/trades/new"><Plus className="mr-2 h-4 w-4" />Add Trade</Link></Button>
          <Button variant="outline" asChild><Link href="/export"><Download className="mr-2 h-4 w-4" />Export</Link></Button>
        </div>
      }
    >
      <div className="mb-6 grid gap-4 md:gap-6 md:grid-cols-[1fr_280px] lg:grid-cols-[1fr_320px]">
        <Card className="terminal-panel py-6">
          <CardContent className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="min-w-0">
              <div className="terminal-kicker mb-2">Trade Ledger</div>
              <h2 className="text-xl md:text-2xl lg:text-3xl font-semibold tracking-tight text-white">Execution History</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">A dense ledger of entries, exits and outcomes for rapid review.</p>
            </div>
            <div className="terminal-panel-muted px-4 py-3 text-right">
              <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Recorded trades</div>
              <div className="mt-2 text-3xl font-semibold text-white">{trades.length}</div>
            </div>
          </CardContent>
        </Card>
        <Card className="terminal-panel py-6">
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <div className="terminal-kicker">Workflow</div>
            <p>Use this ledger to spot repeated execution patterns and tag anomalies before they become habits.</p>
          </CardContent>
        </Card>
      </div>

      <Card className="terminal-table mt-4 py-0 shadow-none">
        <CardHeader className="border-b border-slate-800/50 pb-4">
          <CardTitle className="text-lg font-medium text-white">Execution History</CardTitle>
          <CardDescription>{trades.length} trades recorded in your journal</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto text-xs md:text-sm">
            <table className="w-full text-left font-mono text-xs md:text-sm">
              <thead className="border-b border-slate-800 text-xs uppercase text-slate-400">
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
                    <td colSpan={9} className="px-4 py-8 text-center font-sans text-slate-500">No trades found. Start logging your executions.</td>
                  </tr>
                ) : (
                  trades.map((trade) => {
                    const pl = Number(trade.profitLoss ?? 0)
                    const pct = Number(trade.profitLossPct ?? 0)
                    const isWin = pl > 0
                    const isLoss = pl < 0
                    const isOpen = trade.status === "open"

                    return (
                      <tr key={trade.id} className="group cursor-pointer transition-colors hover:bg-slate-800/30">
                        <td className="whitespace-nowrap px-4 py-2.5"><StatusPill state={isOpen ? "open" : isWin ? "win" : "loss"} /></td>
                        <td className="whitespace-nowrap px-4 py-2.5 text-slate-300">{new Date(trade.entryTime).toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" })}</td>
                        <td className="whitespace-nowrap px-4 py-2.5 font-bold tracking-wide text-sky-400">{trade.symbol}</td>
                        <td className="px-4 py-2.5 text-right text-slate-300">{formatCurrency(Number(trade.entryPrice), 2)}</td>
                        <td className="px-4 py-2.5 text-right text-slate-300">{trade.exitPrice ? formatCurrency(Number(trade.exitPrice), 2) : "—"}</td>
                        <td className="px-4 py-2.5 text-right text-slate-400">{trade.quantity}</td>
                        <td className={`px-4 py-2.5 text-right font-medium ${isWin ? "text-emerald-400" : isLoss ? "text-rose-400" : "text-amber-400"}`}>{isOpen ? "—" : formatCurrency(pl)}</td>
                        <td className={`px-4 py-2.5 text-right ${isWin ? "text-emerald-400/80" : isLoss ? "text-rose-400/80" : "text-amber-400/80"}`}>{isOpen ? "—" : formatPct(pct)}</td>
                        <td className="px-4 py-2.5 text-center"><SidePill tradeType={trade.tradeType} /></td>
                      </tr>
                    )
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
  return <div className={`inline-flex items-center rounded border px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest ${isLong ? "border-emerald-500 text-emerald-400" : "border-rose-500 text-rose-400"}`}>{tradeType}</div>
}
