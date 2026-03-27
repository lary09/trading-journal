import { and, desc, eq, gte, lte } from "drizzle-orm"
import { NextResponse } from "next/server"

import { db } from "@/db/client"
import { bars1d, symbols } from "@/db/schema"

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const ticker = searchParams.get("symbol")
  const start = searchParams.get("start")
  const end = searchParams.get("end")
  const limitParam = Number(searchParams.get("limit") ?? "200")

  if (!ticker) {
    return NextResponse.json({ error: "symbol is required" }, { status: 400 })
  }

  const limit = Number.isFinite(limitParam) ? Math.min(Math.max(limitParam, 1), 1000) : 200

  const clauses = [eq(symbols.ticker, ticker)]
  if (start) clauses.push(gte(bars1d.tradingDay, new Date(start)))
  if (end) clauses.push(lte(bars1d.tradingDay, new Date(end)))

  const where = clauses.slice(1).reduce((acc, clause) => and(acc, clause), clauses[0])

  const rows = await db
    .select({
      symbol: symbols.ticker,
      tradingDay: bars1d.tradingDay,
      open: bars1d.open,
      high: bars1d.high,
      low: bars1d.low,
      close: bars1d.close,
      volume: bars1d.volume,
      vwap: bars1d.vwap,
    })
    .from(bars1d)
    .innerJoin(symbols, eq(bars1d.symbolId, symbols.id))
    .where(where)
    .orderBy(desc(bars1d.tradingDay))
    .limit(limit)

  return NextResponse.json({ data: rows })
}
