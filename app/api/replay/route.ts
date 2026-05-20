import { NextResponse } from "next/server"
import { and, eq, gte, lte } from "drizzle-orm"

import { auth } from "@/auth"
import { db } from "@/db/client"
import { bars1d, symbols } from "@/db/schema"
import { getYahooDailyBars } from "@/lib/data/bars"

export async function GET(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const symbol = searchParams.get("symbol")
  const startParam = searchParams.get("start")
  const endParam = searchParams.get("end")

  if (!symbol) return NextResponse.json({ error: "symbol required" }, { status: 400 })

  const startStr = startParam ? new Date(startParam).toISOString().split("T")[0] : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
  const endStr = endParam ? new Date(endParam).toISOString().split("T")[0] : new Date().toISOString().split("T")[0]

  const start = new Date(startStr)
  const end = new Date(endStr)

  // 1. Intentar cargar desde Base de Datos Local
  try {
    const normalizedSymbol = symbol.trim().toUpperCase()
    const clauses = [eq(symbols.ticker, normalizedSymbol)]
    if (startParam) clauses.push(gte(bars1d.tradingDay, startStr))
    if (endParam) clauses.push(lte(bars1d.tradingDay, endStr))

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

    if (rows.length > 0) {
      return NextResponse.json({ bars: rows, source: "local" })
    }
  } catch (error) {
    console.warn("DB Query failed, falling back to Yahoo Finance")
  }

  // 2. Fallback Automático: Yahoo Finance Public API (Si no hay datos locales)
  try {
    const mappedBars = (await getYahooDailyBars(symbol, start, end)).map((bar) => ({
      tradingDay: bar.time,
      open: bar.open.toFixed(4),
      high: bar.high.toFixed(4),
      low: bar.low.toFixed(4),
      close: bar.close.toFixed(4),
      volume: "0",
    }))

    return NextResponse.json({ bars: mappedBars, source: "yahoo", message: rowsMessage(mappedBars.length) })

  } catch (apiError) {
    console.error("YF API Fallback failed:", apiError)
    return NextResponse.json({ bars: [], source: "yahoo", message: "No local bars found and Yahoo fallback failed." })
  }
}

function rowsMessage(count: number) {
  return count > 0
    ? "Loaded from Yahoo fallback because local bars were not available yet."
    : "No local or fallback data was found for the selected range."
}
