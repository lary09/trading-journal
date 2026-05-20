import { NextResponse } from "next/server"
import { and, asc, eq, gte, lte, type SQL } from "drizzle-orm"

import { auth } from "@/auth"
import { db } from "@/db/client"
import { trades } from "@/db/schema"
import { createTrade } from "@/lib/data/trades"
import { enforceRiskLimits } from "@/lib/risk/rules"

export async function GET(req: Request) {
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const start = searchParams.get("start")
  const end = searchParams.get("end")
  const status = searchParams.get("status")
  const limitParam = Number(searchParams.get("limit") ?? "1000")

  const limit = Number.isFinite(limitParam) ? Math.min(Math.max(limitParam, 1), 5000) : 1000

  const clauses: SQL<unknown>[] = [eq(trades.userId, userId)]
  if (status) clauses.push(eq(trades.status, status))
  if (start) clauses.push(gte(trades.entryTime, new Date(start)))
  if (end) clauses.push(lte(trades.entryTime, new Date(end)))

  const where = clauses.length === 1 ? clauses[0] : and(...clauses)!

  const rows = await db.select().from(trades).where(where).orderBy(asc(trades.entryTime)).limit(limit)

  return NextResponse.json({ data: rows })
}

export async function POST(req: Request) {
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json().catch(() => null)
  if (!body?.symbol || !body?.tradeType || !body?.marketType || !body?.entryPrice || !body?.quantity) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
  }

  try {
    await enforceRiskLimits(userId, Number(body.profitLoss ?? 0) || 0)

    const trade = await createTrade({
      userId,
      symbol: body.symbol,
      tradeType: body.tradeType,
      marketType: body.marketType,
      strategyId: body.strategyId ?? null,
      entryPrice: Number(body.entryPrice),
      exitPrice: body.exitPrice ? Number(body.exitPrice) : null,
      quantity: Number(body.quantity),
      stopLoss: body.stopLoss ? Number(body.stopLoss) : null,
      takeProfit: body.takeProfit ? Number(body.takeProfit) : null,
      riskAmount: body.riskAmount ? Number(body.riskAmount) : null,
      profitLoss: body.profitLoss ?? null,
      profitLossPct: body.profitLossPct ?? null,
      entryTime: body.entryTime ? new Date(body.entryTime) : new Date(),
      exitTime: body.exitTime ? new Date(body.exitTime) : null,
      status: body.status ?? "open",
      tradeSetup: body.tradeSetup ?? null,
      tradeOutcome: body.tradeOutcome ?? null,
      lessonsLearned: body.lessonsLearned ?? null,
      confidenceLevel: body.confidenceLevel ?? null,
      emotionalState: body.emotionalState ?? null,
      marketCondition: body.marketCondition ?? null,
      newsImpact: body.newsImpact ?? null,
      additionalNotes: body.additionalNotes ?? null,
      chartScreenshotUrl: body.chartScreenshotUrl ?? null,
    })

    return NextResponse.json({ data: trade }, { status: 201 })
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("RIESGO:")) {
      return NextResponse.json({ error: error.message }, { status: 403 })
    }
    console.error("Error creating trade", error)
    return NextResponse.json({ error: "Failed to create trade" }, { status: 500 })
  }
}
