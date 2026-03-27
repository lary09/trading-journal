import { NextResponse } from "next/server"
import { and, asc, eq, gte, lte } from "drizzle-orm"

import { auth } from "@/auth"
import { db } from "@/db/client"
import { riskRules, trades } from "@/db/schema"
import { createTrade } from "@/lib/data/trades"

const startOfUtcDay = () => {
  const d = new Date()
  d.setUTCHours(0, 0, 0, 0)
  return d
}
const startOfUtcWeek = () => {
  const d = startOfUtcDay()
  const day = d.getUTCDay()
  d.setUTCDate(d.getUTCDate() - day)
  return d
}

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

  const clauses = [eq(trades.userId, userId)]
  if (status) clauses.push(eq(trades.status, status))
  if (start) clauses.push(gte(trades.entryTime, new Date(start)))
  if (end) clauses.push(lte(trades.entryTime, new Date(end)))

  const where =
    clauses.length > 1 ? clauses.slice(1).reduce((acc, clause) => and(acc, clause), clauses[0]) : clauses[0]

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

  // Risk enforcement (daily/weekly loss limits on realized PnL)
  const [rule] = await db.select().from(riskRules).where(eq(riskRules.userId, userId))
  if (rule?.alertsEnabled) {
    const dailyStart = startOfUtcDay()
    const weeklyStart = startOfUtcWeek()
    const rows = await db
      .select({ profitLoss: trades.profitLoss, entryTime: trades.entryTime })
      .from(trades)
      .where(and(eq(trades.userId, userId), eq(trades.status, "closed"), gte(trades.entryTime, weeklyStart)))

    const dailyPnl = rows
      .filter((t) => new Date(t.entryTime).getTime() >= dailyStart.getTime())
      .reduce((acc, t) => acc + Number(t.profitLoss ?? 0), 0)
    const weeklyPnl = rows.reduce((acc, t) => acc + Number(t.profitLoss ?? 0), 0)

    if (rule.dailyLossLimit && dailyPnl <= -Number(rule.dailyLossLimit)) {
      return NextResponse.json({ error: "Daily loss limit reached. Trade blocked." }, { status: 403 })
    }
    if (rule.weeklyLossLimit && weeklyPnl <= -Number(rule.weeklyLossLimit)) {
      return NextResponse.json({ error: "Weekly loss limit reached. Trade blocked." }, { status: 403 })
    }
  }

  try {
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
    console.error("Error creating trade", error)
    return NextResponse.json({ error: "Failed to create trade" }, { status: 500 })
  }
}
