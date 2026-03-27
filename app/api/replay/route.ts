import { NextResponse } from "next/server"
import { and, eq, gte, lte } from "drizzle-orm"

import { auth } from "@/auth"
import { db } from "@/db/client"
import { bars1d, symbols } from "@/db/schema"

export async function GET(req: Request) {
  const session = await auth()
  if (!session?.user?.id && process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const symbol = searchParams.get("symbol")
  const start = searchParams.get("start")
  const end = searchParams.get("end")
  if (!symbol) return NextResponse.json({ error: "symbol required" }, { status: 400 })

  const clauses = [eq(symbols.ticker, symbol.toUpperCase())]
  if (start) clauses.push(gte(bars1d.tradingDay, new Date(start)))
  if (end) clauses.push(lte(bars1d.tradingDay, new Date(end)))

  const rows = await db
    .select({
      tradingDay: bars1d.tradingDay,
      open: bars1d.open,
      high: bars1d.high,
      low: bars1d.low,
      close: bars1d.close,
      volume: bars1d.volume,
    })
    .from(bars1d)
    .innerJoin(symbols, eq(bars1d.symbolId, symbols.id))
    .where(clauses.length === 1 ? clauses[0] : and(...clauses))
    .orderBy(bars1d.tradingDay)

  return NextResponse.json({ bars: rows })
}
