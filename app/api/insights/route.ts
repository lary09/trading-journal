import { NextResponse } from "next/server"
import { and, eq } from "drizzle-orm"

import { auth } from "@/auth"
import { db } from "@/db/client"
import { trades } from "@/db/schema"

export async function GET() {
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const rows = await db.select().from(trades).where(and(eq(trades.userId, userId), eq(trades.status, "closed")))
  if (!rows.length) {
    return NextResponse.json({
      insights: [
        "Sin trades cerrados aún. Registra operaciones para generar insights.",
      ],
    })
  }

  const bySymbol: Record<string, { wins: number; losses: number; pnl: number }> = {}
  const byHour: Record<number, { wins: number; losses: number }> = {}
  const byEmotion: Record<string, { wins: number; losses: number }> = {}

  for (const t of rows) {
    const symbol = t.symbol
    const pnl = Number(t.profitLoss ?? 0)
    const isWin = pnl > 0
    bySymbol[symbol] = bySymbol[symbol] || { wins: 0, losses: 0, pnl: 0 }
    if (isWin) bySymbol[symbol].wins++
    else bySymbol[symbol].losses++
    bySymbol[symbol].pnl += pnl

    const hour = new Date(t.entryTime).getUTCHours()
    byHour[hour] = byHour[hour] || { wins: 0, losses: 0 }
    if (isWin) byHour[hour].wins++
    else byHour[hour].losses++

    if (t.emotionalState) {
      const emo = t.emotionalState.toLowerCase()
      byEmotion[emo] = byEmotion[emo] || { wins: 0, losses: 0 }
      if (isWin) byEmotion[emo].wins++
      else byEmotion[emo].losses++
    }
  }

  const worstHour = Object.entries(byHour)
    .map(([h, v]) => ({ hour: Number(h), winrate: v.wins / Math.max(1, v.wins + v.losses) }))
    .sort((a, b) => a.winrate - b.winrate)[0]

  const bestSymbol = Object.entries(bySymbol)
    .map(([s, v]) => ({ symbol: s, pnl: v.pnl }))
    .sort((a, b) => b.pnl - a.pnl)[0]

  const worstEmotion = Object.entries(byEmotion)
    .map(([e, v]) => ({ emotion: e, winrate: v.wins / Math.max(1, v.wins + v.losses) }))
    .sort((a, b) => a.winrate - b.winrate)[0]

  const insights: string[] = []
  if (worstHour) insights.push(`Tus peores resultados son alrededor de la hora UTC ${worstHour.hour}. Considera evitar ese bloque.`)
  if (bestSymbol) insights.push(`Tu mejor activo es ${bestSymbol.symbol} con PnL acumulado ${bestSymbol.pnl.toFixed(2)}.`)
  if (worstEmotion) insights.push(`Cuando reportas "${worstEmotion.emotion}" tu win rate cae a ${(worstEmotion.winrate * 100).toFixed(1)}%.`)
  if (!insights.length) insights.push("Sigue registrando trades para generar insights más claros.")

  return NextResponse.json({ insights })
}
