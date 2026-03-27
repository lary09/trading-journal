import { NextResponse } from "next/server"
import { eq, and, gte, lte } from "drizzle-orm"

import { auth } from "@/auth"
import { db } from "@/db/client"
import { backtests, bars1d, symbols } from "@/db/schema"

type BacktestPayload = {
  name?: string
  strategyId?: string | null
  parameters?: Record<string, unknown>
  runNow?: boolean
}

export async function POST(req: Request) {
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  let body: BacktestPayload | null = null

  try {
    body = await req.json()
  } catch (error) {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  const { name, strategyId, parameters, runNow } = body ?? {}

  if (!name) {
    return NextResponse.json({ error: "name is required" }, { status: 400 })
  }

  const [record] = await db
    .insert(backtests)
    .values({
      userId,
      name,
      strategyId: strategyId ?? null,
      parameters: parameters ?? null,
    })
    .returning()

  if (runNow) {
    const result = await runSimpleBacktest(record.id)
    return NextResponse.json({ backtest: result }, { status: 201 })
  }

  return NextResponse.json({ backtest: record }, { status: 201 })
}

type BacktestResult = {
  simpleReturn: number
  bars: number
  maxDrawdown: number
  pnlSeries: number[]
}

export async function GET() {
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const rows = await db
    .select()
    .from(backtests)
    .where(eq(backtests.userId, userId))
    .orderBy(backtests.createdAt)

  return NextResponse.json({ backtests: rows })
}

async function runSimpleBacktest(backtestId: string) {
  const bt = (
    await db
      .select()
      .from(backtests)
      .where(eq(backtests.id, backtestId))
      .limit(1)
  )[0]

  const params = bt.parameters as any
  const symbol = params?.symbol as string | undefined
  const start = params?.start ? new Date(params.start) : undefined
  const end = params?.end ? new Date(params.end) : undefined
  if (!symbol) return bt

  const where = [
    eq(symbols.ticker, symbol),
    start ? gte(bars1d.tradingDay, start) : undefined,
    end ? lte(bars1d.tradingDay, end) : undefined,
  ].filter(Boolean) as any[]

  const bars = await db
    .select({ close: bars1d.close })
    .from(bars1d)
    .innerJoin(symbols, eq(bars1d.symbolId, symbols.id))
    .where(where.length === 1 ? where[0] : and(...where))
    .orderBy(bars1d.tradingDay)

  if (!bars.length) return bt

  const closes = bars.map((b) => Number(b.close))
  const simpleReturn = calcReturn(closes)
  const maxDrawdown = calcMaxDrawdown(closes)

  const updated = (
    await db
      .update(backtests)
      .set({
        status: "completed",
        metrics: { simpleReturn, bars: closes.length, maxDrawdown, pnlSeries: closes },
        updatedAt: new Date(),
      })
      .where(eq(backtests.id, backtestId))
      .returning()
  )[0]

  return updated
}

function calcReturn(closes: number[]): number {
  if (!closes.length) return 0
  const first = closes[0]
  const last = closes[closes.length - 1]
  return first ? (last - first) / first : 0
}

function calcMaxDrawdown(closes: number[]): number {
  let peak = closes[0] || 0
  let maxDd = 0
  for (const c of closes) {
    if (c > peak) peak = c
    const dd = peak ? (c - peak) / peak : 0
    if (dd < maxDd) maxDd = dd
  }
  return maxDd
}
