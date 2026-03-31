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
  const startParam = searchParams.get("start")
  const endParam = searchParams.get("end")

  if (!symbol) return NextResponse.json({ error: "symbol required" }, { status: 400 })

  const startStr = startParam ? new Date(startParam).toISOString().split("T")[0] : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
  const endStr = endParam ? new Date(endParam).toISOString().split("T")[0] : new Date().toISOString().split("T")[0]

  const start = new Date(startStr)
  const end = new Date(endStr)

  // 1. Intentar cargar desde Base de Datos Local
  try {
    const clauses = [eq(symbols.ticker, symbol.toUpperCase())]
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
      return NextResponse.json({ bars: rows }) // Asegurar formato ISO
    }
  } catch (error) {
    console.warn("DB Query failed, falling back to Yahoo Finance")
  }

  // 2. Fallback Automático: Yahoo Finance Public API (Si no hay datos locales)
  try {
    const period1 = Math.floor(start.getTime() / 1000)
    const period2 = Math.floor(end.getTime() / 1000) + 86400 // add 1 day to be inclusive
    
    const yfUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol.toUpperCase()}?interval=1d&period1=${period1}&period2=${period2}`
    
    const res = await fetch(yfUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      }
    })
    
    if (!res.ok) throw new Error("YF API failed")
    
    const data = await res.json()
    const result = data.chart.result?.[0]
    
    if (!result || !result.timestamp) {
      return NextResponse.json({ bars: [] })
    }

    const timestamps = result.timestamp as number[]
    const quotes = result.indicators.quote[0]
    
    const mappedBars = timestamps.map((ts, i) => {
      // YF sometimes returns nulls for halted days
      if (quotes.open[i] === null) return null
      
      const date = new Date(ts * 1000)
      return {
        tradingDay: date.toISOString().split("T")[0],
        open: Number(quotes.open[i]).toFixed(4),
        high: Number(quotes.high[i]).toFixed(4),
        low: Number(quotes.low[i]).toFixed(4),
        close: Number(quotes.close[i]).toFixed(4),
        volume: quotes.volume[i] ? quotes.volume[i].toString() : "0",
      }
    }).filter(Boolean)

    return NextResponse.json({ bars: mappedBars })

  } catch (apiError) {
    console.error("YF API Fallback failed:", apiError)
    return NextResponse.json({ bars: [] })
  }
}
