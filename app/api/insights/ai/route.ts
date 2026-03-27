import { NextResponse } from "next/server"
import { and, eq } from "drizzle-orm"

import { auth } from "@/auth"
import { db } from "@/db/client"
import { trades } from "@/db/schema"
import { generateAiInsights } from "@/lib/ai/insights"

export async function GET() {
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const rows = await db
    .select({
      symbol: trades.symbol,
      profitLoss: trades.profitLoss,
      entryTime: trades.entryTime,
      exitTime: trades.exitTime,
      tradeType: trades.tradeType,
      marketType: trades.marketType,
      strategyId: trades.strategyId,
      emotionalState: trades.emotionalState,
      status: trades.status,
    })
    .from(trades)
    .where(and(eq(trades.userId, userId), eq(trades.status, "closed")))
    .limit(500)

  if (!rows.length) {
    return NextResponse.json({ error: null, insights: "Aún no hay trades cerrados para analizar." })
  }

  const { insights, error } = await generateAiInsights(rows as any)
  return NextResponse.json({ insights, error })
}
